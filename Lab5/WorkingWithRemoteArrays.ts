import type { Express } from "express";
import { booleanValue, found, HttpError, numberValue, param, requireText } from "../http";

interface Todo { id: number; title: string; completed: boolean; description: string }
export default function WorkingWithRemoteArrays(app: Express) {
  let todos: Todo[] = [
    { id: 1, title: "Read Chapter 5", completed: false, description: "HTTP servers" },
    { id: 2, title: "Install Express", completed: true, description: "Server dependencies" },
    { id: 3, title: "Connect the Dashboard", completed: false, description: "Load courses over HTTP" },
    { id: 4, title: "Create Lab 5", completed: true, description: "Client exercises" },
  ];
  let nextId = Date.now();
  const get = (id: string) => found(todos.find((item) => item.id === numberValue(id, "ID")), "Todo");
  const create = (input: Partial<Todo>) => {
    const todo: Todo = {
      id: ++nextId, title: requireText(input.title, "Title"),
      completed: input.completed === undefined ? false : booleanValue(input.completed),
      description: typeof input.description === "string" ? input.description : "",
    };
    todos.push(todo); return todo;
  };
  const remove = (id: string) => { const todo = get(id); todos = todos.filter((item) => item.id !== todo.id); };
  app.get("/lab5/todos", (req, res) => res.json(req.query.completed === undefined ? todos : todos.filter((item) => item.completed === booleanValue(req.query.completed))));
  app.get("/lab5/todos/create", (_req, res) => { create({ title: "New Task" }); res.json(todos); });
  app.get("/lab5/todos/:id", (req, res) => res.json(get(param(req, "id"))));
  app.get("/lab5/todos/:id/delete", (req, res) => { remove(param(req, "id")); res.json(todos); });
  app.get("/lab5/todos/:id/title/:title", (req, res) => { get(param(req, "id")).title = param(req, "title"); res.json(todos); });
  app.get("/lab5/todos/:id/completed/:completed", (req, res) => { get(param(req, "id")).completed = booleanValue(param(req, "completed")); res.json(todos); });
  app.get("/lab5/todos/:id/description/:description", (req, res) => { get(param(req, "id")).description = param(req, "description"); res.json(todos); });
  app.post("/lab5/todos", (req, res) => res.status(201).json(create(req.body)));
  app.delete("/lab5/todos/:id", (req, res) => {
    const id = param(req, "id");
    if (!todos.some((item) => String(item.id) === id)) throw new HttpError(404, `Unable to delete Todo with ID ${id}`);
    remove(id); res.sendStatus(200);
  });
  app.put("/lab5/todos/:id", (req, res) => {
    const id = param(req, "id");
    if (!todos.some((item) => String(item.id) === id)) throw new HttpError(404, `Unable to update Todo with ID ${id}`);
    const todo = get(id);
    if (req.body.title !== undefined) todo.title = requireText(req.body.title, "Title");
    if (req.body.completed !== undefined) todo.completed = booleanValue(req.body.completed);
    if (typeof req.body.description === "string") todo.description = req.body.description;
    res.json(todo);
  });
}
