import type { Express } from "express";
import { HttpError, numberValue, param } from "../http";

export function calculate(operation: string, a: number, b: number) {
  let result: number;
  switch (operation) {
    case "add": result = a + b; break;
    case "subtract": result = a - b; break;
    case "multiply": result = a * b; break;
    case "divide":
      if (b === 0) throw new HttpError(400, "Cannot divide by zero.");
      result = a / b; break;
    default: throw new HttpError(400, "Unknown operation.");
  }
  if (!Number.isFinite(result)) throw new HttpError(400, "Result must be finite.");
  return result;
}
export default function PathParameters(app: Express) {
  for (const operation of ["add", "subtract", "multiply", "divide"])
    app.get(`/lab5/${operation}/:a/:b`, (req, res) => {
      res.json(calculate(operation, numberValue(param(req, "a"), "A"), numberValue(param(req, "b"), "B")));
    });
}
