-- Up Migration
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    cottage_id INTEGER NOT NULL REFERENCES cottages(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    kids INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_bookings_cottage_id ON bookings(cottage_id);
CREATE INDEX idx_bookings_dates ON bookings(cottage_id, check_in, check_out);

-- Down Migration
DROP TABLE IF EXISTS bookings;
