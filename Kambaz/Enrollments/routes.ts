import type { Express } from "express";
import type { Database } from "../Database/types";
import EnrollmentsDao from "./dao";
import { checkCourse, checkUserAccess, param, signedIn, userId } from "../../http";
import { publicUser } from "../Users/dao";

export default function EnrollmentRoutes(app: Express, db: Database) {
  const dao = EnrollmentsDao(db);
  app.get("/api/users/:uid/enrollments", signedIn, (req, res) => {
    const id = userId(req); checkUserAccess(req, id); res.json(dao.forUser(id));
  });
  app.get("/api/courses/:cid/users", (req, res) => {
    const cid = param(req, "cid"); checkCourse(db, cid);
    res.json(db.users.filter((user) => db.enrollments.some((e) => e.user === user._id && e.course === cid)).map(publicUser));
  });
  app.post("/api/users/:uid/courses/:cid", signedIn, (req, res) => {
    const uid = userId(req); checkUserAccess(req, uid);
    res.json(dao.enroll(uid, param(req, "cid")));
  });
  app.delete("/api/users/:uid/courses/:cid", signedIn, (req, res) => {
    const uid = userId(req); checkUserAccess(req, uid);
    dao.unenroll(uid, param(req, "cid")); res.sendStatus(200);
  });
}
