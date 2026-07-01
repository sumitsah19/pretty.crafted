-- Coupon snapshot applied at placement, and admin-set shipping/tracking details
-- surfaced once an order ships. See Order.java.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS coupon_code      VARCHAR(40),
    ADD COLUMN IF NOT EXISTS discount_amount  DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS courier          VARCHAR(80),
    ADD COLUMN IF NOT EXISTS tracking_number  VARCHAR(120),
    ADD COLUMN IF NOT EXISTS tracking_url     VARCHAR(500);
