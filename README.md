# Webdev Server

Zongbin Yan — CS5610, Chapter 5

Express APIs for the Kambaz client and Lab 5.

## Run

```sh
npm ci
cp .env.example .env
npm run dev
```

The server listens on port 4000. `/` and `/lab5/welcome` return greetings. `/api/courses` returns the course list, and `/api/courses/RS101/modules` returns modules for RS101.

`/lab5` includes path and query calculators, assignment and module objects, and todo CRUD. Kambaz endpoints under `/api` manage accounts, courses, modules, assignments, and enrollments. Writes to course content require a faculty session. Seed users `nick_fury` and `iron_man` have password `123`.

Data and sessions are held in memory for this chapter. They survive browser refreshes and reset when the server restarts.

## Check

```sh
npm run build
npm test
```

## Render

Use the `a5` branch, build command `npm ci --omit=dev`, and start command `npm start`. The included `render.yaml` configures a free web service.

Set `SERVER_ENV=production`, `CLIENT_URL` to the Vercel origin, `SERVER_URL` to the actual Render hostname, and a private `SESSION_SECRET`. Multiple allowed client origins can be separated by commas. Set `NEXT_PUBLIC_HTTP_SERVER` on the client to the deployed server URL and redeploy the client.
