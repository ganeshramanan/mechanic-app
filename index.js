const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- DATABASE ---------------- */
const db = new sqlite3.Database("./mechanic.db", (err) => {
  if (err) {
    console.error("DB connection error:", err.message);
  } else {
    console.log("SQLite DB connected");
  }
});

/* ---------------- CREATE TABLE ---------------- */
db.run(
  `
  CREATE TABLE IF NOT EXISTS Service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT,
    description TEXT,
    cost INTEGER,
    service_date TEXT
  )
`,
  (err) => {
    if (err) {
      console.error("Table error:", err.message);
    } else {
      console.log("Service table ready");
    }
  },
);

/* ---------------- TEST ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("Mechanic App is running 🚗");
});

/* ---------------- ADD SERVICE ---------------- */
app.post("/service", (req, res) => {
  const { vehicle_number, description, cost } = req.body;

  if (!vehicle_number || !description || !cost) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    `INSERT INTO Service (vehicle_number, description, cost, service_date)
     VALUES (?, ?, ?, DATE('now'))`,
    [vehicle_number, description, cost],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "DB insert failed" });
      }

      res.json({
        message: "Service added successfully",
        id: this.lastID,
      });
    },
  );
});

/* ---------------- GET VEHICLE HISTORY ---------------- */
app.get("/vehicle/:number", (req, res) => {
  const number = req.params.number;

  db.all(
    `SELECT * FROM Service 
     WHERE UPPER(vehicle_number) = UPPER(?) 
     ORDER BY service_date DESC`,
    [number],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "DB query failed" });
      }

      res.json(rows);
    },
  );
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
