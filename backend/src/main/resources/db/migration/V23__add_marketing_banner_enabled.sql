-- Admin toggle for the storefront announcement banner. Null = enabled (rows
-- from before the column existed). See MarketingConfig.java.
ALTER TABLE marketing_config
    ADD COLUMN IF NOT EXISTS banner_enabled BIT(1);
