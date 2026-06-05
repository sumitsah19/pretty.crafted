CREATE TABLE coupons (
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    code             VARCHAR(40) NOT NULL,
    discount_percent INT         NOT NULL,
    expires_on       VARCHAR(40),
    active           BIT(1)      NOT NULL DEFAULT 1,
    uses             INT         NOT NULL DEFAULT 0,
    created_at       DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_coupons_code UNIQUE (code)
);

INSERT INTO coupons (code, discount_percent, expires_on, active, uses, created_at) VALUES
    ('PRETTY15', 15, 'No expiry', 1, 148, NOW(6)),
    ('MAMA20',   20, 'No expiry', 1, 92,  NOW(6)),
    ('GRAD10',   10, 'No expiry', 0, 34,  NOW(6));
