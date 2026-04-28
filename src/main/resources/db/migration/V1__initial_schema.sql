CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    name          VARCHAR(120) NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(16)  NOT NULL DEFAULT 'USER',
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80)  NOT NULL,
    slug        VARCHAR(80)  NOT NULL,
    description VARCHAR(500),
    image_url   VARCHAR(500),
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_name (name),
    UNIQUE KEY uk_categories_slug (slug)
);

CREATE TABLE IF NOT EXISTS products (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    name             VARCHAR(160)   NOT NULL,
    description      VARCHAR(1000),
    price            DECIMAL(10, 2) NOT NULL,
    stock            INT            NOT NULL,
    image_url        VARCHAR(500),
    category_id      BIGINT         NOT NULL,
    popularity_score INT            NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    product_id BIGINT      NOT NULL,
    quantity   INT         NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cart_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS gift_boxes (
    id             BIGINT         NOT NULL AUTO_INCREMENT,
    user_id        BIGINT         NOT NULL,
    box_size       VARCHAR(16)    NOT NULL,
    wrap_type      VARCHAR(16)    NOT NULL DEFAULT 'STANDARD',
    custom_message VARCHAR(150),
    base_price     DECIMAL(10, 2) NOT NULL,
    wrap_price     DECIMAL(10, 2) NOT NULL,
    total_price    DECIMAL(10, 2) NOT NULL,
    status         VARCHAR(16)    NOT NULL DEFAULT 'DRAFT',
    created_at     DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_gift_boxes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS gift_box_items (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    gift_box_id BIGINT NOT NULL,
    product_id  BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_gbi_box FOREIGN KEY (gift_box_id) REFERENCES gift_boxes (id),
    CONSTRAINT fk_gbi_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS orders (
    id                  BIGINT         NOT NULL AUTO_INCREMENT,
    user_id             BIGINT         NOT NULL,
    status              VARCHAR(16)    NOT NULL DEFAULT 'PENDING',
    total_amount        DECIMAL(10, 2) NOT NULL,
    shipping_address    VARCHAR(500)   NOT NULL,
    contact_phone       VARCHAR(20)    NOT NULL,
    razorpay_order_id   VARCHAR(80),
    razorpay_payment_id VARCHAR(80),
    payment_status      VARCHAR(16)    NOT NULL DEFAULT 'PENDING',
    created_at          DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id          BIGINT         NOT NULL AUTO_INCREMENT,
    order_id    BIGINT         NOT NULL,
    product_id  BIGINT,
    gift_box_id BIGINT,
    item_name   VARCHAR(200)   NOT NULL,
    quantity    INT            NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    line_total  DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_oi_order    FOREIGN KEY (order_id)    REFERENCES orders (id),
    CONSTRAINT fk_oi_product  FOREIGN KEY (product_id)  REFERENCES products (id),
    CONSTRAINT fk_oi_giftbox  FOREIGN KEY (gift_box_id) REFERENCES gift_boxes (id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    token      VARCHAR(64) NOT NULL,
    user_id    BIGINT      NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used       BIT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_prt_token (token),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id)
);
