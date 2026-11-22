import courses from "./courses.json";
import modules from "./modules.json";
import assignments from "./assignments.json";
import users from "./users.json";
import enrollments from "./enrollments.json";
import { hashPassword } from "../Users/passwords";
import type { Database } from "./types";

export function createDatabase(): Database {
  return {
    courses: structuredClone(courses),
    modules: structuredClone(modules),
    assignments: structuredClone(assignments),
    users: users.map((user) => ({ ...user, dob: "", passwordHash: hashPassword("123") })),
    enrollments: structuredClone(enrollments),
  };
}
