ALTER TABLE equipment
    ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP;

ALTER TABLE loans
    ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP;

UPDATE equipment
SET updated_date = created_date
WHERE updated_date IS NULL;

UPDATE loans
SET updated_date = loan_date
WHERE updated_date IS NULL;

ALTER TABLE equipment
    ALTER COLUMN updated_date SET NOT NULL;

ALTER TABLE loans
    ALTER COLUMN updated_date SET NOT NULL;