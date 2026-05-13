DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
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
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_equipment_type_not_blank'
    ) THEN
ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_type_not_blank
        CHECK (length(trim(type)) > 0);
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_loans_borrower_name_not_blank'
    ) THEN
ALTER TABLE loans
    ADD CONSTRAINT chk_loans_borrower_name_not_blank
        CHECK (length(trim(borrower_name)) > 0);
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_loans_email_not_blank'
    ) THEN
ALTER TABLE loans
    ADD CONSTRAINT chk_loans_email_not_blank
        CHECK (length(trim(email)) > 0);
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_loans_phone_number_not_blank'
    ) THEN
ALTER TABLE loans
    ADD CONSTRAINT chk_loans_phone_number_not_blank
        CHECK (length(trim(phone_number)) > 0);
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