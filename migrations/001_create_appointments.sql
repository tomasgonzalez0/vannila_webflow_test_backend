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
