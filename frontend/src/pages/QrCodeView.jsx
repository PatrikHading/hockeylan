import {
    useEffect,
    useState,
} from "react";
import { useParams } from "react-router";
import api from "../api/api";

const typeLabels = {
    COMPLETE_KIT:
        "Komplett utrustning",
    HELMET: "Hjälm",
    SKATES: "Skridskor",
    STICK: "Klubba",
};

const conditionLabels = {
    NEW: "Ny",
    GOOD: "Bra",
    WORN: "Sliten",
    NEEDS_REPAIR:
        "Behöver repareras",
};

const ageCategoryLabels = {
    CHILD: "Barn",
    JUNIOR: "Junior",
    SENIOR: "Senior",
};

export default function QrCodeView() {
    const { id } = useParams();

    const [qrData, setQrData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [
        copyMessage,
        setCopyMessage,
    ] = useState("");

    useEffect(() => {
        let activeRequest = true;

        async function fetchQrCode() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        `/admin/equipment/${id}/qr`
                    );

                if (activeRequest) {
                    setQrData(response.data);
                }
            } catch (requestError) {
                if (activeRequest) {
                    setError(
                        requestError
                            .response
                            ?.data
                            ?.message
                        || requestError
                            .displayMessage
                        || "Kunde inte hämta QR-kod."
                    );
                }
            } finally {
                if (activeRequest) {
                    setLoading(false);
                }
            }
        }

        fetchQrCode();

        return () => {
            activeRequest = false;
        };
    }, [id]);

    async function copyUrl() {
        if (!qrData?.loanUrl) {
            return;
        }

        try {
            await navigator.clipboard
                .writeText(
                    qrData.loanUrl
                );

            setCopyMessage(
                "Länk kopierad!"
            );

            window.setTimeout(() => {
                setCopyMessage("");
            }, 2500);
        } catch {
            setCopyMessage(
                "Kunde inte kopiera länken."
            );
        }
    }

    function downloadQrCode() {
        if (!qrData) {
            return;
        }

        const link =
            document.createElement("a");

        link.href =
            `data:image/png;base64,${qrData.qrCodeBase64}`;

        link.download =
            `${qrData.serialNumber}-qr.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadQrLabel() {
        if (!qrData) {
            return;
        }

        const canvas =
            document.createElement(
                "canvas"
            );

        const context =
            canvas.getContext("2d");

        if (!context) {
            setCopyMessage(
                "Kunde inte skapa QR-etiketten."
            );

            return;
        }

        canvas.width = 900;
        canvas.height = 1200;

        const qrImage = new Image();

        qrImage.onload = () => {
            const status =
                getEquipmentStatus(
                    qrData
                );

            context.fillStyle =
                "#ffffff";

            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            context.fillStyle =
                "#0f172a";

            context.font =
                "bold 54px Arial";

            context.textAlign =
                "center";

            context.fillText(
                "HockeyLån",
                canvas.width / 2,
                90
            );

            context.fillStyle =
                "#334155";

            context.font =
                "32px Arial";

            context.fillText(
                "Skanna för att låna utrustning",
                canvas.width / 2,
                145
            );

            context.drawImage(
                qrImage,
                190,
                200,
                520,
                520
            );

            context.fillStyle =
                "#0f172a";

            context.font =
                "bold 42px Arial";

            context.fillText(
                typeLabels[qrData.type]
                || qrData.type
                || "Utrustning",
                canvas.width / 2,
                790
            );

            context.fillStyle =
                "#475569";

            context.font =
                "30px Arial";

            context.fillText(
                qrData.serialNumber,
                canvas.width / 2,
                845
            );

            const details =
                createLabelDetails(
                    qrData
                );

            if (details) {
                context.font =
                    "26px Arial";

                context.fillText(
                    truncateText(
                        details,
                        48
                    ),
                    canvas.width / 2,
                    895
                );
            }

            if (qrData.description) {
                context.font =
                    "24px Arial";

                context.fillText(
                    truncateText(
                        qrData.description,
                        55
                    ),
                    canvas.width / 2,
                    940
                );
            }

            context.fillStyle =
                getCanvasStatusColor(
                    status
                );

            context.font =
                "bold 30px Arial";

            context.fillText(
                getStatusTitle(status),
                canvas.width / 2,
                1000
            );

            context.fillStyle =
                "#64748b";

            context.font =
                "22px Arial";

            context.fillText(
                "QR-koden leder direkt till låneformuläret",
                canvas.width / 2,
                1080
            );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                canvas.toDataURL(
                    "image/png"
                );

            link.download =
                `${qrData.serialNumber}-qr-etikett.png`;

            document.body
                .appendChild(link);

            link.click();

            document.body
                .removeChild(link);
        };

        qrImage.onerror = () => {
            setCopyMessage(
                "Kunde inte skapa QR-etiketten."
            );
        };

        qrImage.src =
            `data:image/png;base64,${qrData.qrCodeBase64}`;
    }

    function printQrLabel() {
        window.print();
    }

    if (loading) {
        return (
            <div className="mobile-page flex items-center justify-center bg-slate-950 px-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

                    <p className="text-lg text-slate-300">
                        Hämtar QR-kod...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="mobile-page flex items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-md rounded-2xl border border-red-800 bg-red-950 p-8 text-center">
                    <h1 className="mb-4 text-2xl font-bold text-red-300">
                        Något gick fel
                    </h1>

                    <p className="text-red-200">
                        {error
                            || "QR-koden kunde inte visas."}
                    </p>
                </div>
            </div>
        );
    }

    const status =
        getEquipmentStatus(qrData);

    return (
        <div className="mobile-page safe-bottom bg-slate-950 px-4 py-6 print:bg-white">
            <div className="mx-auto max-w-xl">
                <div className="mobile-card overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl print:border-none print:bg-white print:shadow-none">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center print:bg-white">
                        <h1 className="mb-2 text-3xl font-bold text-white print:text-slate-950">
                            QR-kod
                        </h1>

                        <p className="text-blue-100 print:text-slate-700">
                            Skanna för att visa
                            utrustningen
                        </p>
                    </div>

                    <div className="p-5 sm:p-8">
                        <QrStatusPanel
                            status={status}
                        />

                        <EquipmentDetails
                            qrData={qrData}
                        />

                        <div className="mb-6 rounded-3xl bg-white p-5 shadow-inner sm:p-6">
                            <img
                                src={
                                    `data:image/png;base64,${qrData.qrCodeBase64}`
                                }
                                alt={
                                    `QR-kod för ${qrData.serialNumber}`
                                }
                                className="mx-auto w-full max-w-md"
                            />
                        </div>

                        <div className="mb-6 break-all rounded-2xl border border-slate-700 bg-slate-800 p-4 print:hidden">
                            <p className="mb-2 text-sm text-slate-400">
                                Lånelänk
                            </p>

                            <p className="text-sm text-blue-400">
                                {qrData.loanUrl}
                            </p>
                        </div>

                        {copyMessage && (
                            <div className="mb-6 rounded-2xl border border-green-800 bg-green-950 p-4 print:hidden">
                                <p className="text-center text-sm font-medium text-green-300">
                                    {copyMessage}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:hidden">
                            <QrActionButton
                                onClick={copyUrl}
                                className="bg-slate-800 hover:bg-slate-700"
                            >
                                Kopiera länk
                            </QrActionButton>

                            <QrActionButton
                                onClick={
                                    downloadQrCode
                                }
                                className="bg-blue-600 hover:bg-blue-500"
                            >
                                Ladda ner QR
                            </QrActionButton>

                            <QrActionButton
                                onClick={
                                    downloadQrLabel
                                }
                                className="bg-cyan-600 hover:bg-cyan-500"
                            >
                                Ladda ner etikett
                            </QrActionButton>

                            <QrActionButton
                                onClick={
                                    printQrLabel
                                }
                                className="bg-slate-700 hover:bg-slate-600"
                            >
                                Skriv ut
                            </QrActionButton>
                        </div>

                        <div className="mt-6 rounded-2xl border border-blue-800 bg-blue-950 p-4 print:hidden">
                            <p className="text-center text-sm text-blue-200">
                                Om serienumret
                                ändras behöver en
                                ny QR-etikett
                                skrivas ut.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QrStatusPanel({ status }) {
    const configurations = {
        AVAILABLE: {
            container:
                "border-green-700 bg-green-950",
            heading:
                "text-green-300 print:text-green-700",
            title: "Tillgänglig",
            description:
                "Denna utrustning kan lånas via QR-koden.",
        },
        LOANED: {
            container:
                "border-amber-700 bg-amber-950",
            heading:
                "text-amber-300 print:text-amber-700",
            title: "Utlånad",
            description:
                "Utrustningen är redan utlånad och kan inte lånas igen just nu.",
        },
        INACTIVE: {
            container:
                "border-slate-600 bg-slate-800",
            heading:
                "text-slate-200 print:text-slate-700",
            title: "Inaktiverad",
            description:
                "Utrustningen är inte längre tillgänglig för utlåning.",
        },
    };

    const selectedConfiguration =
        configurations[status];

    return (
        <div
            className={[
                "mb-6 rounded-2xl border p-4 print:bg-white",
                selectedConfiguration
                    .container,
            ].join(" ")}
        >
            <p
                className={[
                    "text-sm font-bold",
                    selectedConfiguration
                        .heading,
                ].join(" ")}
            >
                {
                    selectedConfiguration
                        .title
                }
            </p>

            <p className="mt-1 text-sm text-slate-300 print:text-slate-700">
                {
                    selectedConfiguration
                        .description
                }
            </p>
        </div>
    );
}

function EquipmentDetails({
                              qrData,
                          }) {
    const details = [
        {
            label: "Typ",
            value:
                typeLabels[qrData.type]
                || qrData.type,
        },
        {
            label: "Serienummer",
            value:
            qrData.serialNumber,
        },
        {
            label: "Storlek",
            value: qrData.size,
        },
        {
            label: "Märke",
            value: qrData.brand,
        },
        {
            label: "Modell",
            value: qrData.model,
        },
        {
            label: "Skick",
            value:
                conditionLabels[
                    qrData.condition
                    ] || qrData.condition,
        },
        {
            label: "Ålderskategori",
            value:
                ageCategoryLabels[
                    qrData.ageCategory
                    ]
                || qrData.ageCategory,
        },
    ].filter((detail) =>
        Boolean(detail.value)
    );

    return (
        <div className="mb-6 space-y-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 print:border-slate-300 print:bg-white">
            <dl className="space-y-3">
                {details.map((detail) => (
                    <div
                        key={detail.label}
                        className="flex items-center justify-between gap-4"
                    >
                        <dt className="text-sm text-slate-400 print:text-slate-600">
                            {detail.label}
                        </dt>

                        <dd className="text-right text-sm font-semibold text-white print:text-slate-950">
                            {detail.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {qrData.description && (
                <div className="border-t border-slate-700 pt-3 print:border-slate-300">
                    <p className="mb-1 text-sm text-slate-400 print:text-slate-600">
                        Beskrivning
                    </p>

                    <p className="text-sm text-slate-200 print:text-slate-950">
                        {qrData.description}
                    </p>
                </div>
            )}
        </div>
    );
}

function QrActionButton({
                            children,
                            onClick,
                            className,
                        }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "mobile-button rounded-2xl px-4 py-3 font-semibold text-white transition-all",
                className,
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function getEquipmentStatus(
    equipment
) {
    if (!equipment.active) {
        return "INACTIVE";
    }

    return equipment.available
        ? "AVAILABLE"
        : "LOANED";
}

function getStatusTitle(status) {
    const titles = {
        AVAILABLE: "Tillgänglig",
        LOANED: "Utlånad",
        INACTIVE: "Inaktiverad",
    };

    return titles[status];
}

function getCanvasStatusColor(
    status
) {
    const colors = {
        AVAILABLE: "#166534",
        LOANED: "#92400e",
        INACTIVE: "#475569",
    };

    return colors[status];
}

function createLabelDetails(qrData) {
    return [
        qrData.brand,
        qrData.model,
        qrData.size
            ? `Storlek ${qrData.size}`
            : null,
    ]
        .filter(Boolean)
        .join(" • ");
}

function truncateText(
    value,
    maximumLength
) {
    if (!value) {
        return "";
    }

    if (
        value.length
        <= maximumLength
    ) {
        return value;
    }

    return `${value.slice(
        0,
        maximumLength - 1
    )}…`;
}