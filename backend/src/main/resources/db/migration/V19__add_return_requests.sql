-- Customer-raised return/exchange requests against a single delivered order
-- item, plus their evidence photo URLs. See ReturnRequest.java.
CREATE TABLE IF NOT EXISTS return_requests (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    order_id       BIGINT       NOT NULL,
    order_item_id  BIGINT       NOT NULL,
    item_name      VARCHAR(200) NOT NULL,
    type           VARCHAR(16)  NOT NULL,
    reason         VARCHAR(120) NOT NULL,
    details        TEXT,
    status         VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    admin_note     VARCHAR(500),
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_rr_user       FOREIGN KEY (user_id)       REFERENCES users (id),
    CONSTRAINT fk_rr_order      FOREIGN KEY (order_id)      REFERENCES orders (id),
    CONSTRAINT fk_rr_order_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
);

CREATE TABLE IF NOT EXISTS return_request_images (
    return_request_id BIGINT NOT NULL,
    image_url          VARCHAR(500),
    CONSTRAINT fk_rri_return_request FOREIGN KEY (return_request_id) REFERENCES return_requests (id)
);
