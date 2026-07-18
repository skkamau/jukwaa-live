-- Stage 5A adds provider-independent broadcast sessions without provisioning a paid service.
CREATE TYPE "stream_status" AS ENUM ('PREPARING', 'LIVE', 'ENDED', 'CANCELLED', 'FAILED');
CREATE TYPE "streaming_provider_type" AS ENUM ('MOCK', 'LOCAL', 'AMAZON_IVS');

CREATE TABLE "streaming_channel_configs" (
  "id" UUID NOT NULL,
  "channel_id" UUID NOT NULL,
  "provider" "streaming_provider_type" NOT NULL,
  "provider_channel_id" VARCHAR(255),
  "ingest_endpoint" VARCHAR(2048),
  "playback_url" VARCHAR(2048),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "streaming_channel_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "streams" (
  "id" UUID NOT NULL,
  "channel_id" UUID NOT NULL,
  "title" VARCHAR(140) NOT NULL,
  "description" VARCHAR(1000),
  "category" VARCHAR(80) NOT NULL,
  "language" VARCHAR(40) NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "mature_content" BOOLEAN NOT NULL DEFAULT false,
  "status" "stream_status" NOT NULL DEFAULT 'PREPARING',
  "streaming_provider" "streaming_provider_type" NOT NULL,
  "provider_stream_id" VARCHAR(255),
  "started_at" TIMESTAMPTZ(3),
  "ended_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "streaming_channel_configs_channel_id_key" ON "streaming_channel_configs"("channel_id");
CREATE UNIQUE INDEX "streaming_channel_configs_provider_channel_id_key" ON "streaming_channel_configs"("provider_channel_id");
CREATE INDEX "streaming_channel_configs_provider_idx" ON "streaming_channel_configs"("provider");
CREATE INDEX "streams_channel_id_created_at_idx" ON "streams"("channel_id", "created_at");
CREATE INDEX "streams_status_started_at_idx" ON "streams"("status", "started_at");
CREATE INDEX "streams_provider_stream_id_idx" ON "streams"("provider_stream_id");

-- PostgreSQL enforces one conflicting broadcast per channel even under concurrent requests.
CREATE UNIQUE INDEX "streams_one_active_per_channel_key"
  ON "streams"("channel_id")
  WHERE "status" IN ('PREPARING', 'LIVE');

ALTER TABLE "streaming_channel_configs"
  ADD CONSTRAINT "streaming_channel_configs_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "streams"
  ADD CONSTRAINT "streams_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
