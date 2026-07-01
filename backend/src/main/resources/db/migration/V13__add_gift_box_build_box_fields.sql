-- Which "Build Your Own Box" design the customer picked, plus a denormalized
-- snapshot of its title/image (build_box_id is a soft reference — no FK — so
-- admin can delete a BuildBox without ever failing; see GiftBox.java).
ALTER TABLE gift_boxes
    ADD COLUMN IF NOT EXISTS build_box_id   BIGINT,
    ADD COLUMN IF NOT EXISTS box_title      VARCHAR(160),
    ADD COLUMN IF NOT EXISTS box_image_url  VARCHAR(500);
