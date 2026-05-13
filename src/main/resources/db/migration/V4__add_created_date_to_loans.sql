ALTER TABLE loans
    ADD COLUMN IF NOT EXISTS created_date TIMESTAMP;

UPDATE loans
SET created_date = COALESCE(loan_date, CURRENT_TIMESTAMP)
WHERE created_date IS NULL;

ALTER TABLE loans
    ALTER COLUMN created_date SET NOT NULL;