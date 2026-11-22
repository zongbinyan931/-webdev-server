import { randomUUID } from "node:crypto";
import type { Database, Module } from "../Database/types";
import { checkCourse, found, requireText } from "../../http";

export default function ModulesDao(db: Database) {
  return {
    forCourse: (cid: string) => { checkCourse(db, cid); return db.modules.filter((item) => item.course === cid); },
    create: (cid: string, input: Partial<Module>) => {
      checkCourse(db, cid);
      const module: Module = {
        _id: randomUUID(), course: cid, name: requireText(input.name, "Module name"),
        description: typeof input.description === "string" ? input.description : "", lessons: [],
      };
      db.modules.push(module);
      return module;
    },
    update: (id: string, input: Partial<Module>) => {
      const module = found(db.modules.find((item) => item._id === id), "Module");
      if (input.name !== undefined) module.name = requireText(input.name, "Module name");
      if (typeof input.description === "string") module.description = input.description;
      return module;
    },
    remove: (id: string) => {
      found(db.modules.find((item) => item._id === id), "Module");
      db.modules = db.modules.filter((item) => item._id !== id);
    },
  };
}
