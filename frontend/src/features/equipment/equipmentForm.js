export const equipmentTypes = [
    {
        value: "COMPLETE_KIT",
        label: "Komplett utrustning",
    },
    {
        value: "HELMET",
        label: "Hjälm",
    },
    {
        value: "SKATES",
        label: "Skridskor",
    },
    {
        value: "STICK",
        label: "Klubba",
    },
];

export const equipmentConditions = [
    {
        value: "NEW",
        label: "Ny",
    },
    {
        value: "GOOD",
        label: "Bra",
    },
    {
        value: "WORN",
        label: "Sliten",
    },
    {
        value: "NEEDS_REPAIR",
        label: "Behöver repareras",
    },
];

export const ageCategories = [
    {
        value: "",
        label: "Ingen ålderskategori",
    },
    {
        value: "CHILD",
        label: "Barn",
    },
    {
        value: "JUNIOR",
        label: "Junior",
    },
    {
        value: "SENIOR",
        label: "Senior",
    },
];

export const initialEquipmentFormData = {
    type: "HELMET",
    serialNumber: "",
    size: "",
    brand: "",
    model: "",
    condition: "GOOD",
    ageCategory: "",
    storageLocation: "",
    description: "",
};

export function equipmentToFormData(
    equipment
) {
    return {
        type:
            equipment?.type
            || initialEquipmentFormData.type,
        serialNumber:
            equipment?.serialNumber
            || "",
        size:
            equipment?.size
            || "",
        brand:
            equipment?.brand
            || "",
        model:
            equipment?.model
            || "",
        condition:
            equipment?.condition
            || initialEquipmentFormData.condition,
        ageCategory:
            equipment?.ageCategory
            || "",
        storageLocation:
            equipment?.storageLocation
            || "",
        description:
            equipment?.description
            || "",
    };
}

export function createEquipmentPayload(
    formData
) {
    return {
        type: formData.type,
        serialNumber:
            formData.serialNumber.trim(),
        size:
            emptyToNull(formData.size),
        brand:
            emptyToNull(formData.brand),
        model:
            emptyToNull(formData.model),
        condition: formData.condition,
        ageCategory:
            formData.ageCategory || null,
        storageLocation:
            emptyToNull(
                formData.storageLocation
            ),
        description:
            emptyToNull(
                formData.description
            ),
    };
}

function emptyToNull(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim();

    return normalizedValue
        ? normalizedValue
        : null;
}