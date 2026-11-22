import type { Express } from "express";
import { booleanValue, numberValue, param } from "../http";

export default function WorkingWithRemoteObjects(app: Express) {
  const assignment = {
    id: 1, title: "NodeJS Assignment", description: "Create a NodeJS server with ExpressJS",
    due: "2026-11-29", completed: false, score: 0,
  };
  const module = { id: "M501", name: "HTTP Servers", description: "Express routes and HTTP requests", course: "CS5610" };
  app.get("/lab5/assignment", (_req, res) => res.json(assignment));
  app.get("/lab5/assignment/title", (_req, res) => res.json(assignment.title));
  app.get("/lab5/assignment/title/:title", (req, res) => { assignment.title = param(req, "title"); res.json(assignment); });
  app.get("/lab5/assignment/score/:score", (req, res) => { assignment.score = numberValue(param(req, "score"), "Score"); res.json(assignment); });
  app.get("/lab5/assignment/completed/:completed", (req, res) => { assignment.completed = booleanValue(param(req, "completed")); res.json(assignment); });
  app.get("/lab5/module", (_req, res) => res.json(module));
  app.get("/lab5/module/name", (_req, res) => res.json(module.name));
  app.get("/lab5/module/name/:name", (req, res) => { module.name = param(req, "name"); res.json(module); });
  app.get("/lab5/module/description/:description", (req, res) => { module.description = param(req, "description"); res.json(module); });
}
