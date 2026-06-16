-- Canonicalize users.phone to E.164 (+91XXXXXXXXXX) and enforce one account per
-- phone, so phone-OTP login resolves to the existing email/password or Google
-- account instead of silently creating a duplicate (splitting order/wishlist
-- history). Mirrors AuthService.normalizeIndianPhone: accepts raw 10-digit,
-- 0-prefixed, 91-prefixed or +91-prefixed Indian mobiles (subscriber digit 6-9).

-- 1) Canonicalize every parseable Indian mobile; leave anything else untouched.
UPDATE users
SET phone = CASE
    WHEN CHAR_LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '')) = 12
         AND REGEXP_REPLACE(phone, '[^0-9]', '') LIKE '91%'
         AND SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 3) REGEXP '^[6-9][0-9]{9}$'
        THEN CONCAT('+91', SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 3))
    WHEN CHAR_LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '')) = 11
         AND REGEXP_REPLACE(phone, '[^0-9]', '') LIKE '0%'
         AND SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 2) REGEXP '^[6-9][0-9]{9}$'
        THEN CONCAT('+91', SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 2))
    WHEN REGEXP_REPLACE(phone, '[^0-9]', '') REGEXP '^[6-9][0-9]{9}$'
        THEN CONCAT('+91', REGEXP_REPLACE(phone, '[^0-9]', ''))
    ELSE phone
END
WHERE phone IS NOT NULL;

-- 2) A UNIQUE index allows many NULLs but only one empty string, so normalize
--    blanks to NULL before adding the constraint.
UPDATE users SET phone = NULL WHERE phone = '';

-- 3) De-duplicate: keep the phone on the oldest account in each colliding group
--    and clear it on the newer rows. Accounts (and their orders/wishlist) are
--    preserved — only the now-ambiguous phone link is dropped from duplicates.
UPDATE users u
JOIN (
    SELECT phone, MIN(id) AS keep_id
    FROM users
    WHERE phone IS NOT NULL
    GROUP BY phone
    HAVING COUNT(*) > 1
) dup ON u.phone = dup.phone AND u.id <> dup.keep_id
SET u.phone = NULL;

-- 4) Enforce uniqueness going forward. MySQL permits repeated NULLs, so
--    phone-less accounts are unaffected — this is the nullable-aware equivalent
--    of a partial unique index. It also closes the OTP find-or-create race:
--    a concurrent second insert for a new number is now rejected by the DB.
CREATE UNIQUE INDEX uk_users_phone ON users (phone);
