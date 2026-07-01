-- Admin-managed occasion catalog ("Gifts for Every Occasion") and the
-- homepage featured banner. See Occasion.java.
CREATE TABLE IF NOT EXISTS occasions (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    slug           VARCHAR(60)  NOT NULL,
    title          VARCHAR(120) NOT NULL,
    description    VARCHAR(200) NOT NULL,
    icon           VARCHAR(16),
    icon_image_url VARCHAR(500),
    color          VARCHAR(20)  NOT NULL,
    season         VARCHAR(40),
    cta_label      VARCHAR(60),
    active         BOOLEAN      NOT NULL DEFAULT FALSE,
    featured       BOOLEAN      NOT NULL DEFAULT FALSE,
    visible        BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_occasions_slug (slug)
);
