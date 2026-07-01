-- Flat delivery fee charged at placement (free at/above the threshold in
-- OrderService). Null on orders that predate the fee. See Order.java.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);
