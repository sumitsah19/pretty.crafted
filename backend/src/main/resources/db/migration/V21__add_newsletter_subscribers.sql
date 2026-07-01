-- Homepage newsletter form submissions. See NewsletterSubscriber.java /
-- NewsletterController.java. Unique on email so re-subscribing is idempotent.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    email      VARCHAR(160) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_newsletter_subscribers_email (email)
);
