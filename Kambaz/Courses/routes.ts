import type { Express, RequestHandler } from "express";
import type { Database } from "../Database/types";
import CoursesDao from "./dao";
import EnrollmentsDao from "../Enrollments/dao";
import { faculty, param, signedIn, userId, checkUserAccess } from "../../http";

export default function CourseRoutes(app: Express, db: Database) {
  const dao = CoursesDao(db);
  const enrollments = EnrollmentsDao(db);
  app.get("/api/courses", (_req, res) => res.json(dao.findAll()));
  app.get("/api/courses/:cid", (req, res) => res.json(dao.findById(param(req, "cid"))));
  app.get("/api/users/:uid/courses", signedIn, (req, res) => {
    const id = userId(req);
    checkUserAccess(req, id);
    res.json(enrollments.coursesForUser(id));
  });
  const create: RequestHandler = (req, res) => {
    const course = dao.create(req.body);
    enrollments.enroll(req.session.currentUser!._id, course._id);
    res.status(201).json(course);
  };
  app.post("/api/users/current/courses", faculty, create);
  app.post("/api/courses", faculty, create);
  app.put("/api/courses/:cid", faculty, (req, res) => res.json(dao.update(param(req, "cid"), req.body)));
  app.delete("/api/courses/:cid", faculty, (req, res) => { dao.remove(param(req, "cid")); res.sendStatus(200); });
}
