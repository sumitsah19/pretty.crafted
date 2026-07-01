-- Reconciles schema drift: these Product fields were added to the entity over
-- time and have been relying on ddl-auto=update (local dev only) to exist —
-- with no Flyway coverage, a production boot with ddl-auto=validate against a
-- fresh/rebuilt schema would fail. See Product.java for field docs.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS original_price       DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS materials             TEXT,
    ADD COLUMN IF NOT EXISTS care                  TEXT,
    ADD COLUMN IF NOT EXISTS shipping_and_returns   TEXT,
    ADD COLUMN IF NOT EXISTS rating                DECIMAL(2,1),
    ADD COLUMN IF NOT EXISTS review_count           INT,
    ADD COLUMN IF NOT EXISTS hero_slot              VARCHAR(20);

-- A product can belong to more than one category and target more than one
-- recipient — superseded the single required category_id column and the
-- single recipient column. The legacy columns are left in place (relaxed to
-- nullable below) rather than dropped, since DataSeeder.backfillCategoriesAndRecipients()
-- still reads them once to migrate any pre-existing data into these tables.
CREATE TABLE IF NOT EXISTS product_categories (
    product_id  BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT fk_pc_product  FOREIGN KEY (product_id)  REFERENCES products (id),
    CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS product_recipients (
    product_id BIGINT      NOT NULL,
    recipient  VARCHAR(10),
    CONSTRAINT fk_pr_product FOREIGN KEY (product_id) REFERENCES products (id)
);

-- The old category_id column was NOT NULL with no default; Product no longer
-- maps it, so new inserts (which never supply it) would violate that
-- constraint unless it's relaxed. Idempotent — MODIFYing an already-nullable
-- column is a harmless no-op. (Mirrors ProductRepository.relaxLegacyCategoryIdConstraint(),
-- which patches this at runtime on every boot; captured here too so the
-- migration history is a complete, accurate record of the schema.)
ALTER TABLE products MODIFY COLUMN category_id BIGINT NULL;
