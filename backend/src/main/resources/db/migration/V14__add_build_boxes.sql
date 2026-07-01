-- Admin-curated boxes shown in the storefront "Build Your Own Box" CoverFlow
-- carousel. See BuildBox.java.
CREATE TABLE IF NOT EXISTS build_boxes (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    image_url     VARCHAR(500) NOT NULL,
    title         VARCHAR(160),
    price_small   DECIMAL(10,2),
    price_medium  DECIMAL(10,2),
    price_large   DECIMAL(10,2),
    display_order INT          NOT NULL DEFAULT 0,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);
