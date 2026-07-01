-- Optional redemption cap on a coupon; null means unlimited. See Coupon.java.
ALTER TABLE coupons
    ADD COLUMN IF NOT EXISTS max_uses INT;
