// src/server.js

require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT;
const Url_host = process.env.Url_host ;

app.listen(PORT, () => {
  console.log(`🚀 LMS Auth backend running on ${Url_host}`);
});