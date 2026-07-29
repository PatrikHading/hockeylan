CREATE INDEX idx_loans_history_sort
    ON loans (loan_date DESC, id DESC);

CREATE INDEX idx_loans_status_history_sort
    ON loans (returned, loan_date DESC, id DESC);