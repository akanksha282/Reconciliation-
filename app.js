const express = require("express");
const identifyRoute = require("./routes/routes.js");

const app = express();
app.use(express.json());

app.use("/identify", identifyRoute);

module.exports = app;
