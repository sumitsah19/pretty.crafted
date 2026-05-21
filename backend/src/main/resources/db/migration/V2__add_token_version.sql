-- Invalidates existing JWTs when a user resets their password.
-- Fresh databases get this column via V1; existing databases get it here.
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
