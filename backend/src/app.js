const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
console.log("DB_USER:", process.env.DB_USER);


app.get("/", (req, res) => {
  res.send("Student Job Portal API is running 🚀");
});
const testRoutes = require("./routes/test.routes");
app.use("/api", testRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

app.use("/api/jobs", require("./routes/jobs.routes"));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


