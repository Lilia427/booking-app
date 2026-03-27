-- Up Migration
CREATE TABLE cottages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_night NUMERIC(10, 2) NOT NULL,
    max_guests INTEGER NOT NULL DEFAULT 4,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Down Migration
DROP TABLE IF EXISTS cottages;
