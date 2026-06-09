const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- DATABASE ---------------- */
const db = new Database("mechanic.db");

/* ---------------- TABLE ---------------- */
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS Service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT,
    description TEXT,
    cost INTEGER,
    service_date TEXT,
    next_service_date TEXT,
    phone_number TEXT
  )
`,
).run();

/* ---------------- HOME ---------------- */
app.get("/", (req, res) => {
  res.send("Mechanic App v2 Running 🚗");
});

/* ---------------- ADD SERVICE (WITH REMINDER) ---------------- */
app.post("/service", (req, res) => {
  const { vehicle_number, description, cost, phone_number } = req.body;

  if (!vehicle_number || !description || !cost) {
    return res.status(400).json({
      error: "vehicle_number, description, cost are required",
    });
  }

  try {
    const today = new Date();

    // service date
    const service_date = today.toISOString().split("T")[0];

    // next service date (3 months later)
    const next = new Date();
    next.setMonth(today.getMonth() + 3);
    const next_service_date = next.toISOString().split("T")[0];

    const stmt = db.prepare(`
      INSERT INTO Service (
        vehicle_number,
        description,
        cost,
        service_date,
        next_service_date,
        phone_number
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      vehicle_number,
      description,
      cost,
      service_date,
      next_service_date,
      phone_number || null,
    );

    res.json({
      message: "Service added successfully ✔",
      id: result.lastInsertRowid,
      next_service_date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

/* ---------------- GET VEHICLE HISTORY ---------------- */
app.get("/vehicle/:number", (req, res) => {
  const number = req.params.number;

  try {
    const stmt = db.prepare(`
      SELECT * FROM Service
      WHERE UPPER(vehicle_number) = UPPER(?)
      ORDER BY service_date DESC
    `);

    const rows = stmt.all(number);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Query failed" });
  }
});
app.get("/debug-db", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT vehicle_number, service_date, next_service_date
      FROM Service
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* ---------------- DUE SERVICES API ---------------- */
app.get("/due-services", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const stmt = db.prepare(`
      SELECT * FROM Service
      WHERE next_service_date <= ?
      ORDER BY next_service_date ASC
    `);

    const rows = stmt.all(today);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch due services" });
  }
});
/* ---------------- DEBUG DB API ---------------- */
app.get("/debug-db", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT vehicle_number, service_date, next_service_date
      FROM Service
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




/* ---------------- RESET DB API ---------------- */
app.get("/reset-db", (req, res) => {
  try {
    db.prepare("DROP TABLE IF EXISTS Service").run();

    db.prepare(
      `
      CREATE TABLE Service (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT,
        description TEXT,
        cost INTEGER,
        service_date TEXT,
        next_service_date TEXT,
        phone_number TEXT
      )
    `,
    ).run();

    res.json({ message: "Database reset successful ✔" });
  } catch (err) {
    res.status(500).json({ error: "Reset failed" });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
