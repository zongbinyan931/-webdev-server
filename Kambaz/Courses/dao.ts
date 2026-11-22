import { randomUUID } from "node:crypto";
import type { Course, Database } from "../Database/types";
import { checkCourse, numberValue, requireText } from "../../http";

export default function CoursesDao(db: Database) {
  const clean = (input: Partial<Course>) => {
    const result: Partial<Course> = {};
    for (const key of ["name", "number", "description", "startDate", "endDate", "department", "image", "term"] as const)
      if (typeof input[key] === "string") result[key] = input[key];
    if (input.name !== undefined) result.name = requireText(input.name, "Course name");
    if (input.credits !== undefined) result.credits = numberValue(input.credits, "Credits");
    return result;
  };
  return {
    findAll: () => db.courses,
    findById: (id: string) => checkCourse(db, id),
    create: (input: Partial<Course>) => {
      const course: Course = {
        _id: randomUUID(), name: requireText(input.name, "Course name"), number: "", description: "",
        startDate: "", endDate: "", department: "", credits: 3, image: "/images/reactjs.jpg", term: "Fall 2026",
        ...clean(input),
      };
      db.courses.push(course);
      return course;
    },
    update: (id: string, input: Partial<Course>) => Object.assign(checkCourse(db, id), clean(input)),
    remove: (id: string) => {
      checkCourse(db, id);
      db.courses = db.courses.filter((item) => item._id !== id);
      db.modules = db.modules.filter((item) => item.course !== id);
      db.assignments = db.assignments.filter((item) => item.course !== id);
      db.enrollments = db.enrollments.filter((item) => item.course !== id);
    },
  };
}
