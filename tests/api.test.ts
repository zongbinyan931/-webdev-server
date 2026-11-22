import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../app";

let server: Server;
let base: string;
before(async () => {
  process.env.SERVER_ENV = "development";
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));
async function request(path: string, method = "GET", body?: unknown, cookie = "") {
  const response = await fetch(base + path, {
    method, headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = response.headers.get("content-type")?.includes("json") ? JSON.parse(text) : text;
  return { status: response.status, data, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
}
async function login(username: string) {
  const result = await request("/api/users/signin", "POST", { username, password: "123" });
  assert.equal(result.status, 200); assert.ok(result.cookie); return result.cookie;
}

test("both calculators support arbitrary operands and reject invalid requests", async () => {
  assert.equal((await request("/lab5/welcome")).status, 200);
  for (const [operation, expected] of [["add", 15], ["subtract", 9], ["multiply", 36], ["divide", 4]] as const) {
    assert.equal((await request(`/lab5/${operation}/12/3`)).data, expected);
    assert.equal((await request(`/lab5/calculator?operation=${operation}&a=12&b=3`)).data, expected);
  }
  assert.equal((await request("/lab5/add/-2.5/4.25")).data, 1.75);
  for (const path of ["/lab5/divide/1/0", "/lab5/add/not-a-number/5", "/lab5/calculator?operation=bad&a=1&b=2", "/lab5/calculator?operation=add&a=&b=1"])
    assert.equal((await request(path)).status, 400);
});
test("remote assignment and module changes are visible to later requests", async () => {
  assert.equal((await request("/lab5/assignment")).data.id, 1);
  await request("/lab5/assignment/title/HTTP%20%26%20REST");
  await request("/lab5/assignment/score/91.5");
  await request("/lab5/assignment/completed/true");
  assert.equal((await request("/lab5/assignment/title")).data, "HTTP & REST");
  const assignment = (await request("/lab5/assignment")).data;
  assert.equal(assignment.score, 91.5); assert.equal(assignment.completed, true);
  await request("/lab5/module/name/Module%20test");
  await request("/lab5/module/description/Saved%20description");
  assert.equal((await request("/lab5/module/name")).data, "Module test");
  assert.equal((await request("/lab5/module")).data.description, "Saved description");
});
test("todos support GET exercises, JSON CRUD, filtering, and safe missing-ID errors", async () => {
  const completed = (await request("/lab5/todos?completed=true")).data;
  assert.ok(completed.length > 0 && completed.every((todo: { completed: boolean }) => todo.completed));
  const created = await request("/lab5/todos", "POST", { title: "Integration todo", completed: false });
  assert.equal(created.status, 201);
  const id = created.data.id;
  await request(`/lab5/todos/${id}/title/Renamed`);
  await request(`/lab5/todos/${id}/description/Details`);
  await request(`/lab5/todos/${id}/completed/true`);
  assert.equal((await request(`/lab5/todos/${id}`)).data.description, "Details");
  await request(`/lab5/todos/${id}`, "PUT", { title: "PUT saved", completed: false, id: 999 });
  assert.equal((await request(`/lab5/todos/${id}`)).data.title, "PUT saved");
  await request(`/lab5/todos/${id}/delete`);
  const remaining = (await request("/lab5/todos")).data;
  const missing = await request(`/lab5/todos/${id}`, "DELETE");
  assert.equal(missing.status, 404); assert.match(missing.data.message, /Unable to delete/);
  assert.deepEqual((await request("/lab5/todos")).data, remaining);
  assert.equal((await request(`/lab5/todos/${id}`, "PUT", { title: "Missing" })).status, 404);
  const afterCreate = (await request("/lab5/todos/create")).data;
  assert.equal(afterCreate.length, remaining.length + 1);
  assert.equal((await request(`/lab5/todos/${afterCreate.at(-1).id}`, "DELETE")).status, 200);
});
test("public APIs expose distinct course-scoped lists", async () => {
  const courses = (await request("/api/courses")).data;
  assert.ok(courses.length >= 3 && courses.every((course: { _id: string; name: string }) => course._id && course.name));
  const first = (await request(`/api/courses/${courses[0]._id}/modules`)).data;
  const second = (await request(`/api/courses/${courses[1]._id}/modules`)).data;
  assert.ok(first.length && second.length); assert.notDeepEqual(first, second);
  assert.ok(first.every((module: { course: string }) => module.course === courses[0]._id));
  assert.equal((await request("/api/courses/missing/modules")).status, 404);
});
test("sessions remain isolated across browsers and logout invalidates the session", async () => {
  const faculty = await login("nick_fury"), student = await login("iron_man");
  const f = await request("/api/users/profile", "GET", undefined, faculty);
  const s = await request("/api/users/profile", "GET", undefined, student);
  assert.equal(f.data.username, "nick_fury"); assert.equal(s.data.username, "iron_man");
  assert.ok(!("password" in s.data) && !("passwordHash" in s.data));
  assert.equal((await request("/api/users/profile")).status, 401);
  await request("/api/users/signout", "POST", undefined, student);
  assert.equal((await request("/api/users/profile", "GET", undefined, student)).status, 401);
  assert.equal((await request("/api/users/profile", "GET", undefined, faculty)).status, 200);
});
test("course, module and assignment CRUD keeps server IDs and persists across reads", async () => {
  const cookie = await login("nick_fury");
  const created = await request("/api/users/current/courses", "POST", { name: "Test course", number: "T500" }, cookie);
  assert.equal(created.status, 201);
  const cid = created.data._id;
  assert.ok((await request("/api/users/current/courses", "GET", undefined, cookie)).data.some((course: { _id: string }) => course._id === cid));
  await request(`/api/courses/${cid}`, "PUT", { name: "Saved course", _id: "wrong" }, cookie);
  assert.equal((await request(`/api/courses/${cid}`)).data.name, "Saved course");
  const module = await request(`/api/courses/${cid}/modules`, "POST", { name: "Test module", course: "RS101" }, cookie);
  assert.equal(module.data.course, cid);
  await request(`/api/modules/${module.data._id}`, "PUT", { name: "Saved module" }, cookie);
  assert.equal((await request(`/api/courses/${cid}/modules`)).data[0].name, "Saved module");
  const assignment = await request(`/api/courses/${cid}/assignments`, "POST", { title: "Test assignment", points: 42, notes: "Saved notes" }, cookie);
  await request(`/api/assignments/${assignment.data._id}`, "PUT", { title: "Saved assignment", due: "2026-11-29T23:59", points: 50 }, cookie);
  const saved = (await request(`/api/courses/${cid}/assignments`)).data[0];
  assert.equal(saved.title, "Saved assignment"); assert.equal(saved.points, 50); assert.equal(saved.notes, "Saved notes");
  await request(`/api/modules/${module.data._id}`, "DELETE", undefined, cookie);
  assert.deepEqual((await request(`/api/courses/${cid}/modules`)).data, []);
  await request(`/api/assignments/${assignment.data._id}`, "DELETE", undefined, cookie);
  assert.deepEqual((await request(`/api/courses/${cid}/assignments`)).data, []);
  await request(`/api/courses/${cid}`, "DELETE", undefined, cookie);
  assert.equal((await request(`/api/courses/${cid}`)).status, 404);
});
test("enrollments are idempotent and a student cannot change another user or course content", async () => {
  const cookie = await login("iron_man");
  const id = (await request("/api/users/profile", "GET", undefined, cookie)).data._id;
  const path = `/api/users/${id}/courses/RS104`;
  const a = await request(path, "POST", undefined, cookie), b = await request(path, "POST", undefined, cookie);
  assert.equal(a.data._id, b.data._id);
  assert.ok((await request("/api/users/current/courses", "GET", undefined, cookie)).data.some((course: { _id: string }) => course._id === "RS104"));
  await request(path, "DELETE", undefined, cookie);
  assert.ok(!(await request("/api/users/current/courses", "GET", undefined, cookie)).data.some((course: { _id: string }) => course._id === "RS104"));
  assert.equal((await request("/api/courses/RS101", "DELETE", undefined, cookie)).status, 403);
  assert.equal((await request("/api/courses", "POST", { name: "Unauthorized" })).status, 401);
  assert.equal((await request("/api/users/234/courses/RS104", "POST", undefined, cookie)).status, 403);
});
test("signup rejects duplicates; profile changes survive a fresh login", async () => {
  const signup = await request("/api/users/signup", "POST", { username: "test_new_user", password: "test-password", firstName: "New" });
  assert.equal(signup.status, 201);
  assert.equal((await request("/api/users/signup", "POST", { username: "test_new_user", password: "another" })).status, 409);
  await request(`/api/users/${signup.data._id}`, "PUT", { firstName: "Saved", password: "new-password", role: "ADMIN" }, signup.cookie);
  const profile = (await request("/api/users/profile", "GET", undefined, signup.cookie)).data;
  assert.equal(profile.firstName, "Saved"); assert.equal(profile.role, "STUDENT");
  await request("/api/users/signout", "POST", undefined, signup.cookie);
  const signin = await request("/api/users/signin", "POST", { username: "test_new_user", password: "new-password" });
  assert.equal(signin.status, 200); assert.equal(signin.data.firstName, "Saved");
});
