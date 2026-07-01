-- Admin-managed Help Center FAQ accordion. See Faq.java.
CREATE TABLE IF NOT EXISTS faqs (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    question      VARCHAR(280) NOT NULL,
    answer        TEXT         NOT NULL,
    category      VARCHAR(80),
    display_order INT          NOT NULL DEFAULT 0,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);
