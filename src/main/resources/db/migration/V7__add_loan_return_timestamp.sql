ALTER TABLE loans
    ADD COLUMN returned_at TIMESTAMP WITHOUT TIME ZONE;

UPDATE loans
SET returned_at = COALESCE(
        updated_date,
        loan_date,
        created_date,
        CURRENT_TIMESTAMP
                  )
WHERE returned = TRUE
  AND returned_at IS NULL;

ALTER TABLE loans
    ADD CONSTRAINT chk_loans_return_state_consistent
        CHECK (
            (returned = FALSE AND returned_at IS NULL)
                OR
            (returned = TRUE AND returned_at IS NOT NULL)
            );