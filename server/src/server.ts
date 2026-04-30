import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
  if (err) console.error(err);
  console.log(`Server listening on ${PORT}...`);
});
