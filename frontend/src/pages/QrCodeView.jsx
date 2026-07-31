import {
    useEffect,
    useRef,
    useState,
} from "react";
import { useParams } from "react-router";
import api, {
    getErrorMessage,
    hasErrorCode,
} from "../api/api";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import LinkButton from "../components/ui/LinkButton";

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

    const [loadAttempt, setLoadAttempt] =
        useState(0);

    const [loadError, setLoadError] =
        useState(null);

    const [copying, setCopying] =
        useState(false);

    const [
        generatingLabel,
        setGeneratingLabel,
    ] = useState(false);

    const [feedback, setFeedback] =
        useState(null);

    const labelGenerationRef =
        useRef(false);

    const feedbackTimerRef =
        useRef(null);

    useEffect(() => {
        const controller =
            new AbortController();

        let activeRequest = true;

        async function fetchQrCode() {
            setLoading(true);
            setLoadError(null);
            setQrData(null);

            try {
                const response =
                    await api.get(
                        `/admin/equipment/${encodeURIComponent(
                            id
                        )}/qr`,
                        {
                            signal:
                            controller.signal,
                        }
                    );

                if (activeRequest) {
                    setQrData(
                        response.data
                    );
                }
            } catch (error) {
                if (
                    !activeRequest ||
                    controller.signal.aborted
                ) {
                    return;
                }

                if (
                    hasErrorCode(
                        error,
                        "AUTHENTICATION_REQUIRED"
                    )
                ) {
                    return;
                }

                setLoadError({
                    notFound:
                        hasErrorCode(
                            error,
                            "EQUIPMENT_NOT_FOUND"
                        ) ||
                        hasErrorCode(
                            error,
                            "RESOURCE_NOT_FOUND"
                        ),

                    message:
                        getErrorMessage(
                            error,
                            "Kunde inte hämta QR-koden. Försök igen."
                        ),
                });
            } finally {
                if (activeRequest) {
                    setLoading(false);
                }
            }
        }

        void fetchQrCode();

        return () => {
            activeRequest = false;
            controller.abort();
        };
    }, [id, loadAttempt]);

    useEffect(() => {
        return () => {
            if (
                feedbackTimerRef.current
            ) {
                window.clearTimeout(
                    feedbackTimerRef.current
                );
            }
        };
    }, []);

    function showFeedback(
        type,
        message,
        clearAutomatically = true
    ) {
        if (feedbackTimerRef.current) {
            window.clearTimeout(
                feedbackTimerRef.current
            );
        }

        setFeedback({
            type,
            message,
        });

        if (clearAutomatically) {
            feedbackTimerRef.current =
                window.setTimeout(() => {
                    setFeedback(null);

                    feedbackTimerRef.current =
                        null;
                }, 2500);
        }
    }

    async function copyUrl() {
        if (
            !qrData?.loanUrl ||
            copying
        ) {
            return;
        }

        setCopying(true);

        try {
            if (
                !navigator.clipboard
                    ?.writeText
            ) {
                throw new Error(
                    "Clipboard unavailable"
                );
            }

            await navigator.clipboard.writeText(
                qrData.loanUrl
            );

            showFeedback(
                "success",
                "Länken har kopierats."
            );
        } catch {
            showFeedback(
                "danger",
                "Länken kunde inte kopieras. Markera och kopiera adressen manuellt.",
                false
            );
        } finally {
            setCopying(false);
        }
    }

    function downloadQrCode() {
        if (
            !qrData?.qrCodeBase64 ||
            !qrData?.serialNumber
        ) {
            showFeedback(
                "danger",
                "QR-koden kunde inte laddas ner.",
                false
            );

            return;
        }

        downloadDataUrl(
            `data:image/png;base64,${qrData.qrCodeBase64}`,
            `${qrData.serialNumber}-qr.png`
        );

        showFeedback(
            "success",
            "Nedladdningen av QR-koden har startat."
        );
    }

    function downloadQrLabel() {
        if (
            !qrData ||
            labelGenerationRef.current
        ) {
            return;
        }

        labelGenerationRef.current =
            true;

        setGeneratingLabel(true);

        const canvas =
            document.createElement(
                "canvas"
            );

        const context =
            canvas.getContext("2d");

        if (!context) {
            finishLabelGeneration(
                "danger",
                "QR-etiketten kunde inte skapas."
            );

            return;
        }

        canvas.width = 900;
        canvas.height = 1200;

        const qrImage = new Image();

        qrImage.onload = () => {
            try {
                drawQrLabel(
                    context,
                    canvas,
                    qrImage,
                    qrData
                );

                downloadDataUrl(
                    canvas.toDataURL(
                        "image/png"
                    ),
                    `${qrData.serialNumber}-qr-etikett.png`
                );

                finishLabelGeneration(
                    "success",
                    "Nedladdningen av QR-etiketten har startat."
                );
            } catch {
                finishLabelGeneration(
                    "danger",
                    "QR-etiketten kunde inte skapas."
                );
            }
        };

        qrImage.onerror = () => {
            finishLabelGeneration(
                "danger",
                "QR-etiketten kunde inte skapas."
            );
        };

        qrImage.src =
            `data:image/png;base64,${qrData.qrCodeBase64}`;
    }

    function finishLabelGeneration(
        type,
        message
    ) {
        labelGenerationRef.current =
            false;

        setGeneratingLabel(false);

        showFeedback(
            type,
            message,
            type === "success"
        );
    }

    function printQrLabel() {
        try {
            window.print();
        } catch {
            showFeedback(
                "danger",
                "Utskriftsdialogen kunde inte öppnas.",
                false
            );
        }
    }

    if (loading) {
        return (
            <main
                className="mobile-page flex items-center justify-center bg-slate-950 px-4"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-xl">
                    <div
                        className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400"
                        aria-hidden="true"
                    />

                    <p className="text-lg text-slate-200">
                        Hämtar QR-kod...
                    </p>
                </div>
            </main>
        );
    }

    if (loadError || !qrData) {
        return (
            <main
                className="mobile-page flex items-center justify-center bg-slate-950 px-4 py-8"
                aria-labelledby="qr-load-error-heading"
            >
                <div className="w-full max-w-md space-y-5">
                    <Alert
                        title={
                            loadError
                                ?.notFound
                                ? "Utrustningen finns inte"
                                : "QR-koden kunde inte hämtas"
                        }
                        variant="danger"
                    >
                        {loadError?.message ||
                            "QR-koden kunde inte visas."}
                    </Alert>

                    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                        <h1
                            id="qr-load-error-heading"
                            className="text-xl font-black text-white"
                        >
                            Hur vill du fortsätta?
                        </h1>

                        <div className="mt-5 flex flex-col gap-3">
                            {!loadError
                                ?.notFound && (
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setLoadAttempt(
                                            (current) =>
                                                current +
                                                1
                                        )
                                    }
                                    fullWidth
                                >
                                    Försök igen
                                </Button>
                            )}

                            <LinkButton
                                to="/admin"
                                variant="outline"
                                fullWidth
                            >
                                Till adminvyn
                            </LinkButton>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    const status =
        getEquipmentStatus(qrData);

    return (
        <main
            className="mobile-page safe-bottom bg-slate-950 px-4 py-6 print:bg-white"
            aria-labelledby="qr-code-heading"
        >
            <div className="mx-auto max-w-xl">
                <section className="mobile-card overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl print:border-none print:bg-white print:shadow-none">
                    <header className="bg-gradient-to-r from-blue-700 to-cyan-700 p-6 text-center print:bg-white">
                        <h1
                            id="qr-code-heading"
                            className="mb-2 text-3xl font-bold text-white print:text-slate-950"
                        >
                            QR-kod
                        </h1>

                        <p className="text-blue-50 print:text-slate-700">
                            Skanna för att visa
                            utrustningen
                        </p>
                    </header>

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
                                width="512"
                                height="512"
                                className="mx-auto h-auto w-full max-w-md"
                            />
                        </div>

                        <div className="mb-6 break-all rounded-2xl border border-slate-700 bg-slate-800 p-4 print:hidden">
                            <p className="mb-2 text-sm font-semibold text-slate-300">
                                Lånelänk
                            </p>

                            <a
                                href={
                                    qrData.loanUrl
                                }
                                className="text-sm text-blue-300 underline decoration-blue-400 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                                {
                                    qrData.loanUrl
                                }
                            </a>
                        </div>

                        {feedback && (
                            <div className="mb-6 print:hidden">
                                <Alert
                                    title={
                                        feedback.type ===
                                        "success"
                                            ? "Klart"
                                            : "Åtgärden misslyckades"
                                    }
                                    variant={
                                        feedback.type
                                    }
                                >
                                    {
                                        feedback.message
                                    }
                                </Alert>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:hidden">
                            <Button
                                type="button"
                                variant="secondary"
                                fullWidth
                                loading={
                                    copying
                                }
                                loadingText="Kopierar..."
                                onClick={
                                    copyUrl
                                }
                            >
                                Kopiera länk
                            </Button>

                            <Button
                                type="button"
                                fullWidth
                                onClick={
                                    downloadQrCode
                                }
                            >
                                Ladda ner QR
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                fullWidth
                                loading={
                                    generatingLabel
                                }
                                loadingText="Skapar etikett..."
                                onClick={
                                    downloadQrLabel
                                }
                            >
                                Ladda ner etikett
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                fullWidth
                                onClick={
                                    printQrLabel
                                }
                                className="border-slate-500 bg-slate-800 text-white hover:bg-slate-700"
                            >
                                Skriv ut
                            </Button>
                        </div>

                        <div className="mt-6 rounded-2xl border border-blue-700 bg-blue-950 p-4 print:hidden">
                            <p className="text-center text-sm text-blue-100">
                                Om serienumret
                                ändras behöver en
                                ny QR-etikett
                                skrivas ut.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function QrStatusPanel({
                           status,
                       }) {
    const configurations = {
        AVAILABLE: {
            container:
                "border-green-700 bg-green-950",
            heading:
                "text-green-200 print:text-green-700",
            title: "Tillgänglig",
            description:
                "Denna utrustning kan lånas via QR-koden.",
        },

        LOANED: {
            container:
                "border-amber-700 bg-amber-950",
            heading:
                "text-amber-200 print:text-amber-700",
            title: "Utlånad",
            description:
                "Utrustningen är redan utlånad och kan inte lånas igen just nu.",
        },

        INACTIVE: {
            container:
                "border-slate-600 bg-slate-800",
            heading:
                "text-slate-100 print:text-slate-700",
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
            role="status"
            aria-live="polite"
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

            <p className="mt-1 text-sm text-slate-200 print:text-slate-700">
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
                typeLabels[
                    qrData.type
                    ] || qrData.type,
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
                    ] ||
                qrData.condition,
        },
        {
            label: "Ålderskategori",
            value:
                ageCategoryLabels[
                    qrData.ageCategory
                    ] ||
                qrData.ageCategory,
        },
    ].filter(
        (detail) =>
            Boolean(detail.value)
    );

    return (
        <div className="mb-6 space-y-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 print:border-slate-300 print:bg-white">
            <dl className="space-y-3">
                {details.map(
                    (detail) => (
                        <div
                            key={
                                detail.label
                            }
                            className="flex items-start justify-between gap-4"
                        >
                            <dt className="text-sm text-slate-300 print:text-slate-700">
                                {
                                    detail.label
                                }
                            </dt>

                            <dd className="break-words text-right text-sm font-semibold text-white print:text-slate-950">
                                {
                                    detail.value
                                }
                            </dd>
                        </div>
                    )
                )}
            </dl>

            {qrData.description && (
                <div className="border-t border-slate-700 pt-3 print:border-slate-300">
                    <p className="mb-1 text-sm text-slate-300 print:text-slate-700">
                        Beskrivning
                    </p>

                    <p className="break-words text-sm text-slate-100 print:text-slate-950">
                        {
                            qrData.description
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

function drawQrLabel(
    context,
    canvas,
    qrImage,
    qrData
) {
    const status =
        getEquipmentStatus(qrData);

    context.fillStyle = "#ffffff";
    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    context.fillStyle = "#0f172a";
    context.font =
        "bold 54px Arial";
    context.textAlign = "center";

    context.fillText(
        "HockeyLån",
        canvas.width / 2,
        90
    );

    context.fillStyle = "#334155";
    context.font = "32px Arial";

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

    context.fillStyle = "#0f172a";
    context.font =
        "bold 42px Arial";

    context.fillText(
        typeLabels[qrData.type] ||
        qrData.type ||
        "Utrustning",
        canvas.width / 2,
        790
    );

    context.fillStyle = "#475569";
    context.font = "30px Arial";

    context.fillText(
        qrData.serialNumber,
        canvas.width / 2,
        845
    );

    const details =
        createLabelDetails(qrData);

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

    context.fillStyle = "#64748b";
    context.font = "22px Arial";

    context.fillText(
        "QR-koden leder direkt till låneformuläret",
        canvas.width / 2,
        1080
    );
}

function downloadDataUrl(
    dataUrl,
    filename
) {
    const link =
        document.createElement("a");

    link.href = dataUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        value.length <=
        maximumLength
    ) {
        return value;
    }

    return `${value.slice(
        0,
        maximumLength - 1
    )}…`;
}