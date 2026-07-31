import {
    ageCategories,
    equipmentConditions,
    equipmentTypes,
} from "../../features/equipment/equipmentForm";
import Button from "../ui/Button";
import FormField from "../ui/FormField";

function EquipmentForm({
                           formData,
                           fieldErrors = {},
                           onChange,
                           onSubmit,
                           onCancel,
                           saving = false,
                           submitText = "Spara utrustning",
                           showSerialNumberWarning = false,
                       }) {
    return (
        <form
            onSubmit={onSubmit}
            className="space-y-5"
            noValidate
            aria-busy={saving}
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    id="type"
                    label="Typ av utrustning"
                    required
                    error={fieldErrors.type}
                    helperText="Välj den kategori som passar bäst."
                >
                    <select
                        name="type"
                        value={formData.type}
                        onChange={onChange}
                        disabled={saving}
                    >
                        {equipmentTypes.map(
                            (type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>
                            )
                        )}
                    </select>
                </FormField>

                <FormField
                    id="serialNumber"
                    label="Serienummer"
                    required
                    error={
                        fieldErrors
                            .serialNumber
                    }
                    helperText={
                        showSerialNumberWarning
                            ? "Om serienumret ändras behöver en ny QR-etikett skrivas ut."
                            : "Exempel: HELMET-001 eller KIT-001-JR-M."
                    }
                >
                    <input
                        name="serialNumber"
                        value={
                            formData
                                .serialNumber
                        }
                        onChange={onChange}
                        placeholder="Exempel: HELMET-001"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck="false"
                        minLength={2}
                        maxLength={50}
                        pattern="[A-Za-z0-9_-]+"
                        title="Använd endast bokstäver, siffror, bindestreck och understreck."
                        disabled={saving}
                    />
                </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    id="size"
                    label="Storlek"
                    error={fieldErrors.size}
                    helperText="Exempel: M, 42, 150 cm eller Junior."
                >
                    <input
                        name="size"
                        value={formData.size}
                        onChange={onChange}
                        placeholder="Exempel: M"
                        maxLength={50}
                        disabled={saving}
                    />
                </FormField>

                <FormField
                    id="ageCategory"
                    label="Ålderskategori"
                    error={
                        fieldErrors
                            .ageCategory
                    }
                    helperText="Valfritt för utrustning utan tydlig ålderskategori."
                >
                    <select
                        name="ageCategory"
                        value={
                            formData
                                .ageCategory
                        }
                        onChange={onChange}
                        disabled={saving}
                    >
                        {ageCategories.map(
                            (category) => (
                                <option
                                    key={
                                        category.value ||
                                        "NONE"
                                    }
                                    value={
                                        category.value
                                    }
                                >
                                    {category.label}
                                </option>
                            )
                        )}
                    </select>
                </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    id="brand"
                    label="Märke"
                    error={fieldErrors.brand}
                    helperText="Exempel: Bauer, CCM eller Warrior."
                >
                    <input
                        name="brand"
                        value={formData.brand}
                        onChange={onChange}
                        placeholder="Exempel: Bauer"
                        maxLength={100}
                        disabled={saving}
                    />
                </FormField>

                <FormField
                    id="model"
                    label="Modell"
                    error={fieldErrors.model}
                    helperText="Ange modellnamnet om det är känt."
                >
                    <input
                        name="model"
                        value={formData.model}
                        onChange={onChange}
                        placeholder="Exempel: Re-Akt 150"
                        maxLength={100}
                        disabled={saving}
                    />
                </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    id="condition"
                    label="Skick"
                    required
                    error={
                        fieldErrors.condition
                    }
                    helperText="Bedöm utrustningens nuvarande skick."
                >
                    <select
                        name="condition"
                        value={
                            formData.condition
                        }
                        onChange={onChange}
                        disabled={saving}
                    >
                        {equipmentConditions.map(
                            (condition) => (
                                <option
                                    key={
                                        condition.value
                                    }
                                    value={
                                        condition.value
                                    }
                                >
                                    {condition.label}
                                </option>
                            )
                        )}
                    </select>
                </FormField>

                <FormField
                    id="storageLocation"
                    label="Förvaringsplats"
                    error={
                        fieldErrors
                            .storageLocation
                    }
                    helperText="Intern plats där utrustningen finns."
                >
                    <input
                        name="storageLocation"
                        value={
                            formData
                                .storageLocation
                        }
                        onChange={onChange}
                        placeholder="Exempel: Hylla A2"
                        maxLength={100}
                        disabled={saving}
                    />
                </FormField>
            </div>

            <FormField
                id="description"
                label="Beskrivning"
                error={
                    fieldErrors.description
                }
                helperText="Fri text för information som inte passar i de separata fälten."
            >
                <textarea
                    name="description"
                    value={
                        formData.description
                    }
                    onChange={onChange}
                    rows={4}
                    placeholder="Exempel: Svart hjälm med genomskinligt visir."
                    maxLength={500}
                    disabled={saving}
                />
            </FormField>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    className="sm:w-auto"
                    disabled={saving}
                    onClick={onCancel}
                >
                    Avbryt
                </Button>

                <Button
                    type="submit"
                    loading={saving}
                    loadingText="Sparar..."
                    fullWidth
                    className="sm:w-auto"
                >
                    {submitText}
                </Button>
            </div>
        </form>
    );
}

export default EquipmentForm;