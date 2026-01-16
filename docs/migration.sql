-- prisma/migrations/20260116_postgis_geo_indexes/migration.sql

-- 1) PostGIS extension (Neon supports this)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2) Ensure typed PostGIS columns (explicit types + SRID)
-- NOTE: Prisma may already create these columns as geometry/geography without subtype.
-- These ALTERs enforce Point/Polygon with SRID 4326.

-- Listing.geoPoint => geography(Point, 4326)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Listing' AND column_name = 'geoPoint'
  ) THEN
    -- Ensure correct type
    BEGIN
      ALTER TABLE "Listing"
        ALTER COLUMN "geoPoint" TYPE geography(Point, 4326);
    EXCEPTION WHEN others THEN
      -- If it fails due to existing incompatible type/data, handle manually
      -- by recreating column and backfilling.
      RAISE NOTICE 'Could not alter Listing.geoPoint type; manual intervention may be required.';
    END;
  ELSE
    ALTER TABLE "Listing"
      ADD COLUMN "geoPoint" geography(Point, 4326);
  END IF;
END $$;

-- GeoBoundary.geom => geometry(Polygon, 4326)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'GeoBoundary' AND column_name = 'geom'
  ) THEN
    BEGIN
      ALTER TABLE "GeoBoundary"
        ALTER COLUMN "geom" TYPE geometry(Polygon, 4326);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not alter GeoBoundary.geom type; manual intervention may be required.';
    END;
  ELSE
    ALTER TABLE "GeoBoundary"
      ADD COLUMN "geom" geometry(Polygon, 4326);
  END IF;
END $$;

-- 3) GiST indexes for fast spatial queries
CREATE INDEX IF NOT EXISTS "Listing_geoPoint_gix"
  ON "Listing" USING GIST ("geoPoint");

CREATE INDEX IF NOT EXISTS "GeoBoundary_geom_gix"
  ON "GeoBoundary" USING GIST ("geom");

-- Helpful composite indexes (non-geo)
CREATE INDEX IF NOT EXISTS "Listing_status_publishedAt_idx"
  ON "Listing" ("status", "publishedAt");

CREATE INDEX IF NOT EXISTS "Listing_region_district_idx"
  ON "Listing" ("region", "district");

-- 4) Trigger to keep geoPoint in sync with latitude/longitude
-- This avoids remembering to set geoPoint in every write path.
CREATE OR REPLACE FUNCTION buy_gh_lands_set_geopoint()
RETURNS trigger AS $$
BEGIN
  IF NEW."latitude" IS NOT NULL AND NEW."longitude" IS NOT NULL THEN
    NEW."geoPoint" := ST_SetSRID(ST_MakePoint(NEW."longitude"::double precision, NEW."latitude"::double precision), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_set_geopoint" ON "Listing";

CREATE TRIGGER "trg_set_geopoint"
BEFORE INSERT OR UPDATE OF "latitude", "longitude"
ON "Listing"
FOR EACH ROW
EXECUTE FUNCTION buy_gh_lands_set_geopoint();

-- 5) Optional: backfill existing rows (safe no-op if none)
UPDATE "Listing"
SET "geoPoint" = ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
WHERE "geoPoint" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL;

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Spatial index for ProfessionalProfile.geoPoint (optional but recommended)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ProfessionalProfile' AND column_name = 'geoPoint'
  ) THEN
    BEGIN
      ALTER TABLE "ProfessionalProfile"
        ALTER COLUMN "geoPoint" TYPE geography(Point, 4326);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not alter ProfessionalProfile.geoPoint type; manual intervention may be required.';
    END;
  ELSE
    ALTER TABLE "ProfessionalProfile"
      ADD COLUMN "geoPoint" geography(Point, 4326);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ProfessionalProfile_geoPoint_gix"
  ON "ProfessionalProfile" USING GIST ("geoPoint");

-- USSD: fast lookups by msisdn/status
CREATE INDEX IF NOT EXISTS "UssdSession_msisdn_startedAt_idx"
  ON "UssdSession" ("msisdn", "startedAt");

CREATE INDEX IF NOT EXISTS "UssdSession_status_updatedAt_idx"
  ON "UssdSession" ("status", "updatedAt");

-- Permits: applicant/status filters
CREATE INDEX IF NOT EXISTS "PermitApplication_applicant_status_idx"
  ON "PermitApplication" ("applicantId", "status");

CREATE INDEX IF NOT EXISTS "PermitApplication_assembly_status_idx"
  ON "PermitApplication" ("assemblyId", "status");

-- Marketplace: professional filtering
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_type_active_idx"
  ON "ProfessionalProfile" ("professionalType", "isActive");

CREATE INDEX IF NOT EXISTS "ServiceRequest_professional_status_idx"
  ON "ServiceRequest" ("professionalId", "status");

-- API: key usage logs
CREATE INDEX IF NOT EXISTS "ApiUsageLog_path_createdAt_idx"
  ON "ApiUsageLog" ("path", "createdAt");

-- Webhook deliveries retry queue
CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_nextRetryAt_idx"
  ON "WebhookDelivery" ("status", "nextRetryAt");
