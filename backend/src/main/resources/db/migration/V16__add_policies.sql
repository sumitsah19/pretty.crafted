-- Admin-managed legal/policy documents (Terms, Privacy, Return & Refund, etc.).
-- See Policy.java.
CREATE TABLE IF NOT EXISTS policies (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    slug               VARCHAR(80)  NOT NULL,
    title              VARCHAR(150) NOT NULL,
    short_description  VARCHAR(300),
    content            TEXT         NOT NULL,
    effective_date     DATE,
    last_updated_date  DATE,
    display_order      INT          NOT NULL DEFAULT 0,
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_policies_slug (slug)
);
