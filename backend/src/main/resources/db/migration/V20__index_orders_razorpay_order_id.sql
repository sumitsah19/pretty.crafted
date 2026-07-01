-- orders.razorpay_order_id is looked up on every Razorpay payment webhook
-- (OrderRepository.findByRazorpayOrderId). Index it so that hot path is a point
-- lookup rather than a full table scan as the orders table grows.
CREATE INDEX idx_orders_razorpay_order_id ON orders (razorpay_order_id);
