import type { Express, Request, Response } from "express";
import type { Database, PublicUser } from "../Database/types";
import UsersDao, { publicUser } from "./dao";
import { checkUserAccess, faculty, param, requireText, signedIn } from "../../http";

async function beginSession(req: Request, res: Response, user: PublicUser, status = 200) {
  await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.currentUser = user;
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  res.status(status).json(user);
}
export default function UserRoutes(app: Express, db: Database) {
  const dao = UsersDao(db);
  app.post("/api/users/signin", async (req, res) => {
    const user = dao.authenticate(requireText(req.body.username, "Username"), requireText(req.body.password, "Password"));
    await beginSession(req, res, user);
  });
  app.post("/api/users/signup", async (req, res) => {
    const user = dao.create(req.body);
    await beginSession(req, res, user, 201);
  });
  app.get("/api/users/profile", signedIn, (req, res) => {
    const user = publicUser(dao.findById(req.session.currentUser!._id));
    req.session.currentUser = user;
    res.json(user);
  });
  app.post("/api/users/signout", async (req, res) => {
    await new Promise<void>((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
    res.clearCookie("connect.sid", { path: "/" });
    res.sendStatus(200);
  });
  app.get("/api/users", signedIn, (_req, res) => res.json(dao.findAll()));
  app.post("/api/users", faculty, (req, res) => res.status(201).json(dao.create(req.body)));
  app.put("/api/users/:uid", signedIn, (req, res) => {
    const id = param(req, "uid");
    checkUserAccess(req, id);
    const user = dao.update(id, req.body);
    if (req.session.currentUser?._id === id) req.session.currentUser = user;
    res.json(user);
  });
  app.delete("/api/users/:uid", faculty, (req, res) => {
    const id = param(req, "uid");
    dao.remove(id);
    if (req.session.currentUser?._id === id) delete req.session.currentUser;
    res.sendStatus(200);
  });
}
