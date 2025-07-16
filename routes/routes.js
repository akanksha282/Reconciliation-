const express = require("express");
const router = express.Router();
const identifyController = require("../controller/controller.js");

router.post("/", identifyController);

module.exports = router;
