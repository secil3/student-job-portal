const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { createJob,
    getJobs
 } = require("../controllers/jobs.controller");

router.get("/", getJobs);
router.post("/", auth, createJob);

module.exports = router;