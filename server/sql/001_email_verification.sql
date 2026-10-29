ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE users SET email_verified = TRUE; 

ALTER TABLE users DROP COLUMN IF EXISTS reset_token_hash, DROP COLUMN IF EXISTS reset_expires;

CREATE TABLE IF NOT EXISTS email_otps (
  email        TEXT NOT NULL,
  purpose      TEXT NOT NULL,           
  code_hash    TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (email, purpose)
);
