import type { Express } from "express";
import type { Database } from "../Database/types";
import ModulesDao from "./dao";
import { faculty, param } from "../../http";

export default function ModuleRoutes(app: Express, db: Database) {
  const dao = ModulesDao(db);
  app.get("/api/courses/:cid/modules", (req, res) => res.json(dao.forCourse(param(req, "cid"))));
  app.post("/api/courses/:cid/modules", faculty, (req, res) => res.status(201).json(dao.create(param(req, "cid"), req.body)));
  app.put("/api/modules/:mid", faculty, (req, res) => res.json(dao.update(param(req, "mid"), req.body)));
  app.delete("/api/modules/:mid", faculty, (req, res) => { dao.remove(param(req, "mid")); res.sendStatus(200); });
}
