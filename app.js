import express from "express";
import session from "express-session";

import "dotenv/config";

import arcjet, { validateEmail } from "@arcjet/node";

const app = express();
const port = process.env.PORT || 3000;
const users = [];

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    validateEmail({
      mode: "LIVE",
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
  ],
});

const displayEmails = () => {
  console.log("Registered users");
  users.forEach((user) => console.log(user.email));
};

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const decision = await aj.protect(req, {
      email,
    });
    console.log("Arcjet decision", decision);

    if (decision.isDenied()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello World", email }));

    // check if email already exists
    const user = users.find((user) => user.email === email);
    if (user) {
      return res.status(400).send("Email already exists");
    }

    // send verification email to user
    users.push({ email, password });
  } catch (err) {}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
