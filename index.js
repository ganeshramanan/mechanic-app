const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- DATABASE ---------------- */
const db = new Database("mechanic.db");

// Create table if not exists
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS Service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT,
    description TEXT,
    cost INTEGER,
    service_date TEXT
  )
`,
).run();

/* ---------------- TEST ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("Mechanic App Running 🚗");
});

/* ---------------- ADD SERVICE ---------------- */
app.post("/service", (req, res) => {
  const { vehicle_number, description, cost } = req.body;

  if (!vehicle_number || !description || !cost) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const stmt = db.prepare(`
    INSERT INTO Service (vehicle_number, description, cost, service_date)
    VALUES (?, ?, ?, DATE('now'))
  `);

  stmt.run(vehicle_number, description, cost);

  res.json({ message: "Service added successfully ✔" });
});

/* ---------------- GET VEHICLE HISTORY ---------------- */
app.get("/vehicle/:number", (req, res) => {
  const number = req.params.number;

  const stmt = db.prepare(`
    SELECT * FROM Service
    WHERE UPPER(vehicle_number) = UPPER(?)
    ORDER BY service_date DESC
  `);

  const rows = stmt.all(number);

  res.json(rows);
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
