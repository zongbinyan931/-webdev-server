import type { Express } from "express";
import PathParameters from "./PathParameters";
import QueryParameters from "./QueryParameters";
import WorkingWithRemoteObjects from "./WorkingWithRemoteObjects";
import WorkingWithRemoteArrays from "./WorkingWithRemoteArrays";

export default function Lab5(app: Express) {
  app.get("/lab5/welcome", (_req, res) => res.send("Welcome to Lab 5!"));
  PathParameters(app);
  QueryParameters(app);
  WorkingWithRemoteObjects(app);
  WorkingWithRemoteArrays(app);
}
