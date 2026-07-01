-- Two admin-editable singleton config tables. The app lazily creates the one
-- row each on first read if none exists — see ContactConfigService / MarketingService.

-- Support contact channels shown by the Help Center "Contact Us" action.
-- See ContactConfig.java.
CREATE TABLE IF NOT EXISTS contact_config (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    support_email     VARCHAR(160),
    whatsapp_number   VARCHAR(24),
    phone_number      VARCHAR(24),
    hours             VARCHAR(160),
    email_enabled     BIT(1),
    whatsapp_enabled  BIT(1),
    phone_enabled     BIT(1),
    PRIMARY KEY (id)
);

-- Storefront announcement banner lines (admin-editable, "\n"-separated).
-- See MarketingConfig.java.
CREATE TABLE IF NOT EXISTS marketing_config (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    banner_lines TEXT,
    PRIMARY KEY (id)
);
