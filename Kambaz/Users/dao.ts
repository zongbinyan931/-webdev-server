import { randomUUID } from "node:crypto";
import type { Database, PublicUser, User } from "../Database/types";
import { hashPassword, matchesPassword } from "./passwords";
import { found, HttpError, requireText } from "../../http";

export function publicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
export default function UsersDao(db: Database) {
  function checkUsername(username: string, id?: string) {
    if (db.users.some((user) => user.username === username && user._id !== id))
      throw new HttpError(409, "Username already exists.");
  }
  function fields(input: Record<string, unknown>) {
    const result: Record<string, string> = {};
    for (const key of ["firstName", "lastName", "email", "dob", "loginId", "section", "lastActivity", "totalActivity"])
      if (typeof input[key] === "string") result[key] = input[key];
    return result;
  }
  return {
    findAll: () => db.users.map(publicUser),
    findById: (id: string) => found(db.users.find((user) => user._id === id), "User"),
    authenticate: (username: string, password: string) => {
      const user = db.users.find((item) => item.username === username);
      if (!user || !matchesPassword(password, user.passwordHash))
        throw new HttpError(401, "Invalid username or password.");
      return publicUser(user);
    },
    create: (input: Record<string, unknown>) => {
      const username = requireText(input.username, "Username");
      const password = requireText(input.password, "Password");
      checkUsername(username);
      const user: User = {
        _id: randomUUID(), username, passwordHash: hashPassword(password),
        firstName: "", lastName: "", email: "", dob: "", loginId: "", section: "",
        lastActivity: "", totalActivity: "", ...fields(input),
        role: input.role === "FACULTY" ? "FACULTY" : "STUDENT",
      };
      db.users.push(user);
      return publicUser(user);
    },
    update: (id: string, input: Record<string, unknown>) => {
      const user = found(db.users.find((item) => item._id === id), "User");
      const username = input.username === undefined ? user.username : requireText(input.username, "Username");
      checkUsername(username, id);
      Object.assign(user, fields(input), { username });
      if (typeof input.password === "string" && input.password) user.passwordHash = hashPassword(input.password);
      return publicUser(user);
    },
    remove: (id: string) => {
      found(db.users.find((item) => item._id === id), "User");
      db.users = db.users.filter((item) => item._id !== id);
      db.enrollments = db.enrollments.filter((item) => item.user !== id);
    },
  };
}
