import { randomUUID } from "node:crypto";
import type { Assignment, Database } from "../Database/types";
import { checkCourse, found, HttpError, numberValue, requireText } from "../../http";

export default function AssignmentsDao(db: Database) {
  const clean = (input: Partial<Assignment>) => {
    const result: Partial<Assignment> = {};
    for (const key of ["description", "due", "available", "until", "notes", "group", "gradeAs", "submissionType", "assignTo"] as const)
      if (typeof input[key] === "string") result[key] = input[key];
    if (input.title !== undefined) result.title = requireText(input.title, "Assignment title");
    if (input.points !== undefined) {
      result.points = numberValue(input.points, "Points");
      if (result.points < 0) throw new HttpError(400, "Points cannot be negative.");
    }
    if (Array.isArray(input.options)) result.options = input.options.filter((v) => typeof v === "string");
    return result;
  };
  return {
    forCourse: (cid: string) => { checkCourse(db, cid); return db.assignments.filter((item) => item.course === cid); },
    create: (cid: string, input: Partial<Assignment>) => {
      checkCourse(db, cid);
      const assignment: Assignment = {
        _id: randomUUID(), course: cid, title: requireText(input.title, "Assignment title"),
        description: "", points: 100, due: "", available: "", ...clean(input),
      };
      db.assignments.push(assignment);
      return assignment;
    },
    update: (id: string, input: Partial<Assignment>) => Object.assign(found(db.assignments.find((item) => item._id === id), "Assignment"), clean(input)),
    remove: (id: string) => {
      found(db.assignments.find((item) => item._id === id), "Assignment");
      db.assignments = db.assignments.filter((item) => item._id !== id);
    },
  };
}
