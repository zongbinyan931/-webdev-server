import express from "express";
import cors from "cors";
import session from "express-session";
import { randomBytes } from "node:crypto";
import { createDatabase } from "./Kambaz/Database";
import Lab5 from "./Lab5";
import UserRoutes from "./Kambaz/Users/routes";
import CourseRoutes from "./Kambaz/Courses/routes";
import ModuleRoutes from "./Kambaz/Modules/routes";
import AssignmentRoutes from "./Kambaz/Assignments/routes";
import EnrollmentRoutes from "./Kambaz/Enrollments/routes";
import { errorHandler } from "./http";

export function createApp() {
  const app = express();
  const production = process.env.SERVER_ENV === "production";
  const origins = (process.env.CLIENT_URL || "http://localhost:3000").split(",").map((origin) => origin.trim().replace(/\/$/, ""));
  if (production && !process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required in production.");
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(cors({ origin: origins, credentials: true }));
  app.use(session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false, saveUninitialized: false, proxy: production,
    cookie: { httpOnly: true, sameSite: production ? "none" : "lax", secure: production, maxAge: 24 * 60 * 60 * 1000 },
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
  app.get("/", (_req, res) => res.send("Welcome to Full Stack Development!"));
  app.get("/hello", (_req, res) => res.send("Hello World!"));
  const db = createDatabase();
  Lab5(app);
  UserRoutes(app, db);
  CourseRoutes(app, db);
  ModuleRoutes(app, db);
  AssignmentRoutes(app, db);
  EnrollmentRoutes(app, db);
  app.use((_req, res) => res.status(404).json({ message: "Route not found." }));
  app.use(errorHandler);
  return app;
}
