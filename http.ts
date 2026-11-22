import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import type { Database, PublicUser } from "./Kambaz/Database/types";

declare module "express-session" {
  interface SessionData { currentUser: PublicUser }
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function param(req: Request, name: string) { return String(req.params[name]); }
export function requireText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `${label} is required.`);
  return value.trim();
}
export function numberValue(value: unknown, label: string) {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "")
    throw new HttpError(400, `${label} must be a number.`);
  const result = Number(value);
  if (!Number.isFinite(result)) throw new HttpError(400, `${label} must be a finite number.`);
  return result;
}
export function booleanValue(value: unknown) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new HttpError(400, "Completed must be true or false.");
}
export function found<T>(value: T | undefined, label: string): T {
  if (!value) throw new HttpError(404, `${label} not found.`);
  return value;
}
export const signedIn: RequestHandler = (req, _res, next) => {
  if (!req.session.currentUser) throw new HttpError(401, "Please sign in first.");
  next();
};
export const faculty: RequestHandler = (req, res, next) => {
  signedIn(req, res, () => {
    if (!["FACULTY", "ADMIN"].includes(req.session.currentUser!.role))
      throw new HttpError(403, "A faculty account is required.");
    next();
  });
};
export function userId(req: Request) {
  const uid = param(req, "uid");
  return uid === "current" ? found(req.session.currentUser, "Session")._id : uid;
}
export function checkUserAccess(req: Request, id: string) {
  const user = req.session.currentUser;
  if (!user) throw new HttpError(401, "Please sign in first.");
  if (user._id !== id && !["FACULTY", "ADMIN"].includes(user.role))
    throw new HttpError(403, "You can only change your own account or enrollments.");
}
export function checkCourse(db: Database, id: string) {
  return found(db.courses.find((course) => course._id === id), "Course");
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : error.status === 400 ? 400 : 500;
  res.status(status).json({ message: status === 500 ? "The request could not be completed." : error.message });
};
