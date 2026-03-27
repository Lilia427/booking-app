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
    res.json({ service: "cottage-booking-api", version: "1.0.0" });
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

// ==================== COTTAGES ====================

app.get("/cottages", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM cottages ORDER BY id");
        res.json(result.rows);
    } catch (err) {
        console.error("DB query error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/cottages/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM cottages WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Cottage not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("DB query error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ==================== BOOKINGS ====================

app.get("/bookings", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, c.name AS cottage_name
            FROM bookings b
            JOIN cottages c ON c.id = b.cottage_id
            ORDER BY b.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("DB query error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/bookings/cottage/:cottageId", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM bookings WHERE cottage_id = $1 ORDER BY check_in",
            [req.params.cottageId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("DB query error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/bookings", async (req, res) => {
    const { cottageId, checkIn, checkOut, guestName, guestPhone, adults, kids } = req.body;

    if (!cottageId || !checkIn || !checkOut || !guestName || !guestPhone) {
        return res.status(400).json({
            error: "cottageId, checkIn, checkOut, guestName, guestPhone are required",
        });
    }

    try {
        const conflict = await pool.query(
            `SELECT id FROM bookings
             WHERE cottage_id = $1 AND status != 'cancelled'
               AND check_in < $3 AND check_out > $2`,
            [cottageId, checkIn, checkOut]
        );
        if (conflict.rows.length > 0) {
            return res.status(409).json({ error: "Cottage is already booked for these dates" });
        }

        const result = await pool.query(
            `INSERT INTO bookings (cottage_id, check_in, check_out, guest_name, guest_phone, adults, kids)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [cottageId, checkIn, checkOut, guestName, guestPhone, adults || 1, kids || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("DB insert error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.put("/bookings/:id/status", async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled"];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    try {
        const result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Booking not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("DB update error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.delete("/bookings/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Booking not found" });
        res.json({ message: "Booking deleted" });
    } catch (err) {
        console.error("DB delete error:", err);
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
