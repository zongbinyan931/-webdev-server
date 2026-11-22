import type { Express } from "express";
import { numberValue, requireText } from "../http";
import { calculate } from "./PathParameters";

export default function QueryParameters(app: Express) {
  app.get("/lab5/calculator", (req, res) => res.json(calculate(
    requireText(req.query.operation, "Operation"), numberValue(req.query.a, "A"), numberValue(req.query.b, "B"),
  )));
}
