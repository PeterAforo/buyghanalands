-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Optional: if you use UUIDs instead of cuid()
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helpful indexes (add via Prisma migrate SQL or separate migration)
-- Example: spatial index on boundaries
-- CREATE INDEX IF NOT EXISTS geoboundary_geom_gix ON "GeoBoundary" USING GIST (geom);

-- Example: spatial index on listing point if you populate geoPoint
-- CREATE INDEX IF NOT EXISTS listing_geopoint_gix ON "Listing" USING GIST (geoPoint);
