import type { Express } from "express";
import type { Database } from "../Database/types";
import AssignmentsDao from "./dao";
import { faculty, param } from "../../http";

export default function AssignmentRoutes(app: Express, db: Database) {
  const dao = AssignmentsDao(db);
  app.get("/api/courses/:cid/assignments", (req, res) => res.json(dao.forCourse(param(req, "cid"))));
  app.post("/api/courses/:cid/assignments", faculty, (req, res) => res.status(201).json(dao.create(param(req, "cid"), req.body)));
  app.put("/api/assignments/:aid", faculty, (req, res) => res.json(dao.update(param(req, "aid"), req.body)));
  app.delete("/api/assignments/:aid", faculty, (req, res) => { dao.remove(param(req, "aid")); res.sendStatus(200); });
}
