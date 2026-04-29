import express from "express";
import authRouter from "./auth/auth.routes.js";

const app = express();

app.get("/", (req, res) => res.send("Hello World"));
app.use("/auth", authRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
  if (err) console.error(err);
  console.log(`Server listening on ${PORT}...`);
});
