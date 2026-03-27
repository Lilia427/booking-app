-- Up Migration
INSERT INTO cottages (name, description, price_per_night, max_guests) VALUES
(
    'Runa 1',
    'Comfortable wooden cottage with 3 bedrooms, equipped kitchen, and BBQ area. Located in the heart of the Carpathians in Vorokhta (Danyla Halytskoho St. 146), near the forest. Parking available. Nearby: Bukovel ski resort (20 km), Hoverla mountain (20 km), Vorokhta ski lifts (2 km), Austrian viaduct bridge, Carpathian National Nature Park, mountain rivers and mineral springs.',
    2500.00,
    8
),
(
    'Runa 2',
    'Cozy wooden cottage with 3 bedrooms, terrace, and BBQ area in a quiet location near the forest. Vorokhta (Danyla Halytskoho St. 146) — a perfect base for Carpathian adventures. Parking available. Nearby: Bukovel (20 km), Hoverla (20 km), Yaremche waterfalls (30 km), Verkhovyna (31 km), local restaurants, souvenir shops, and hiking trails.',
    2500.00,
    8
);

-- Down Migration
DELETE FROM cottages WHERE name IN ('Runa 1', 'Runa 2');
