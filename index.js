import express from "express";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGINS || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

// PostgreSQL connection
const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
});

// Root
app.get("/", (req, res) => {
    res.json({ service: "booking-api", version: "1.0.0" });
});

// Health check (потрібен для ALB)
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({ status: "ok" });
    } catch (err) {
        res.status(503).json({ status: "error", message: "Database connection failed" });
    }
});

// GET /bookings
app.get("/bookings", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM bookings ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("DB query error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /booking
app.post("/booking", async (req, res) => {
    const { checkIn, checkOut, adults, kids } = req.body;

    if (!checkIn || !checkOut || !adults || !kids) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO bookings (check_in, check_out, adults, kids)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [checkIn, checkOut, adults, kids]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("DB insert error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Graceful shutdown
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);

const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
        pool.end(() => {
            console.log("Connections closed.");
            process.exit(0);
        });
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
