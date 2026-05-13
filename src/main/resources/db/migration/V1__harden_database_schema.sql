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
    ALTER COLUMN type SET NOT NULL,
ALTER COLUMN serial_number SET NOT NULL,
    ALTER COLUMN available SET NOT NULL,
    ALTER COLUMN created_date SET NOT NULL,
    ALTER COLUMN updated_date SET NOT NULL;

ALTER TABLE loans
    ALTER COLUMN equipment_id SET NOT NULL,
ALTER COLUMN borrower_name SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN phone_number SET NOT NULL,
    ALTER COLUMN loan_date SET NOT NULL,
    ALTER COLUMN returned SET NOT NULL,
    ALTER COLUMN updated_date SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_equipment_serial_number_not_blank'
    ) THEN
ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_serial_number_not_blank
        CHECK (length(trim(serial_number)) > 0);
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_loans_borrower_name_not_blank'
    ) THEN
ALTER TABLE loans
    ADD CONSTRAINT chk_loans_borrower_name_not_blank
        CHECK (length(trim(borrower_name)) > 0);
END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_equipment_serial_number_lower
    ON equipment (lower(serial_number));

CREATE INDEX IF NOT EXISTS idx_equipment_available
    ON equipment (available);

CREATE INDEX IF NOT EXISTS idx_equipment_type
    ON equipment (type);

CREATE INDEX IF NOT EXISTS idx_loans_equipment_id
    ON loans (equipment_id);

CREATE INDEX IF NOT EXISTS idx_loans_returned
    ON loans (returned);

CREATE INDEX IF NOT EXISTS idx_loans_loan_date
    ON loans (loan_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_loans_one_active_loan_per_equipment
    ON loans (equipment_id)
    WHERE returned = false;