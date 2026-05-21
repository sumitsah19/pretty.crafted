-- Users: fields added after initial schema
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS token_version        INT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS email_verified       BIT(1)  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS email_notifications  BIT(1)  NOT NULL DEFAULT 1;

-- Products: recipient and tag fields added after initial schema
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS recipient  VARCHAR(10) NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS tag        VARCHAR(30) NOT NULL DEFAULT '';

-- GiftBoxes: products_total added after initial schema
ALTER TABLE gift_boxes
    ADD COLUMN IF NOT EXISTS products_total  DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Email verification tokens (new table, created fresh if missing)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    token       VARCHAR(64) NOT NULL,
    user_id     BIGINT      NOT NULL,
    expires_at  DATETIME(6) NOT NULL,
    used        BIT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_evt_token (token),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users (id)
);
