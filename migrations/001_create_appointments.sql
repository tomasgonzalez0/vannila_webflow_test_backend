CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  preferred_name text NOT NULL,
  phone text NOT NULL,
  instagram text,
  service text NOT NULL CHECK (service IN (
    'semipermanent',
    'soft-gel',
    'polygel',
    'rubber-base',
    'builder-gel',
    'dual-system',
    'nail-art'
  )),
  date date NOT NULL,
  start_time time NOT NULL,
  design_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_date_start_time_key UNIQUE (date, start_time)
);

CREATE INDEX IF NOT EXISTS appointments_phone_created_at_idx
  ON appointments (phone, created_at DESC);

CREATE TABLE IF NOT EXISTS booking_rate_limits (
  rate_limit_key text PRIMARY KEY,
  window_started timestamptz NOT NULL,
  attempt_count integer NOT NULL CHECK (attempt_count > 0),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS booking_rate_limits_expires_at_idx
  ON booking_rate_limits (expires_at);
