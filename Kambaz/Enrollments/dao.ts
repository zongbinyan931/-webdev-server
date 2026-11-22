import { randomUUID } from "node:crypto";
import type { Database } from "../Database/types";
import { checkCourse, found } from "../../http";

export default function EnrollmentsDao(db: Database) {
  return {
    enroll: (user: string, course: string) => {
      found(db.users.find((item) => item._id === user), "User");
      checkCourse(db, course);
      const existing = db.enrollments.find((item) => item.user === user && item.course === course);
      if (existing) return existing;
      const enrollment = { _id: randomUUID(), user, course };
      db.enrollments.push(enrollment);
      return enrollment;
    },
    unenroll: (user: string, course: string) => {
      db.enrollments = db.enrollments.filter((item) => !(item.user === user && item.course === course));
    },
    forUser: (id: string) => db.enrollments.filter((item) => item.user === id),
    coursesForUser: (id: string) => db.courses.filter((course) => db.enrollments.some((item) => item.user === id && item.course === course._id)),
  };
}
