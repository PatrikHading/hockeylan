ALTER TABLE equipment
    ADD COLUMN size VARCHAR(50),
    ADD COLUMN brand VARCHAR(100),
    ADD COLUMN model VARCHAR(100),
    ADD COLUMN condition VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    ADD COLUMN age_category VARCHAR(30),
    ADD COLUMN storage_location VARCHAR(100),
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_condition_allowed
        CHECK (
            condition IN (
                          'NEW',
                          'GOOD',
                          'WORN',
                          'NEEDS_REPAIR'
                )
            );

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_age_category_allowed
        CHECK (
            age_category IS NULL
                OR age_category IN (
                                    'CHILD',
                                    'JUNIOR',
                                    'SENIOR'
                )
            );

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_size_not_blank
        CHECK (
    size IS NULL
    OR length(trim(size)) > 0
    );

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_brand_not_blank
        CHECK (
            brand IS NULL
                OR length(trim(brand)) > 0
            );

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_model_not_blank
        CHECK (
            model IS NULL
                OR length(trim(model)) > 0
            );

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_storage_location_not_blank
        CHECK (
            storage_location IS NULL
                OR length(trim(storage_location)) > 0
            );

CREATE INDEX idx_equipment_active
    ON equipment (active);

CREATE INDEX idx_equipment_condition
    ON equipment (condition);

CREATE INDEX idx_equipment_age_category
    ON equipment (age_category);

CREATE INDEX idx_equipment_active_available_type
    ON equipment (
                  active,
                  available,
                  type
        );