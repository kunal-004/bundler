"use strict";

require("dotenv").config();
const { connectToDb } = require("./utils");
const app = require("./server");
const port = process.env.BACKEND_PORT || 8080;

app.listen(port, async () => {
  console.log(`Example app listening at http://localhost:${port}`);
  await connectToDb();
});
