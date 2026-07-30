ALTER TABLE loans
    ADD COLUMN expected_return_date DATE;

UPDATE loans
SET expected_return_date =
        CASE
            WHEN returned = TRUE
                THEN GREATEST(
                    loan_date::date,
                    returned_at::date
                     )
            ELSE GREATEST(
                    loan_date::date,
                    CURRENT_DATE
                 )
            END
WHERE expected_return_date IS NULL;

ALTER TABLE loans
    ALTER COLUMN expected_return_date
        SET NOT NULL;

ALTER TABLE loans
    ADD CONSTRAINT chk_loans_expected_return_date_valid
        CHECK (
            expected_return_date >= loan_date::date
    );

CREATE INDEX idx_loans_active_expected_return_date
    ON loans (expected_return_date, id)
    WHERE returned = FALSE;