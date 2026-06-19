-- Customer address book. One row per saved address; at most one is_default per
-- user (enforced by AddressService, not the schema, since MySQL has no partial
-- unique index). Deleting a user cascades to their addresses.
CREATE TABLE IF NOT EXISTS addresses (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    label          VARCHAR(40),
    recipient_name VARCHAR(120) NOT NULL,
    phone          VARCHAR(20)  NOT NULL,
    line1          VARCHAR(200) NOT NULL,
    line2          VARCHAR(200),
    city           VARCHAR(100) NOT NULL,
    state          VARCHAR(100),
    zip            VARCHAR(20)  NOT NULL,
    country        VARCHAR(80)  NOT NULL DEFAULT 'India',
    is_default     BIT(1)       NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_addresses_user ON addresses (user_id);
