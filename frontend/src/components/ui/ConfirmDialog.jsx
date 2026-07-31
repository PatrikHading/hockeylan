import {
    useEffect,
    useId,
    useRef,
} from "react";
import Button from "./Button";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

function ConfirmDialog({
                           open,
                           title = "Bekräfta",
                           message,
                           confirmText = "Bekräfta",
                           cancelText = "Avbryt",
                           onConfirm,
                           onCancel,
                           loading = false,
                           variant = "danger",
                       }) {
    const generatedId = useId();
    const titleId = `confirm-dialog-title-${generatedId}`;
    const descriptionId = `confirm-dialog-description-${generatedId}`;

    const dialogRef = useRef(null);
    const cancelButtonRef = useRef(null);
    const previouslyFocusedElementRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        previouslyFocusedElementRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        cancelButtonRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                if (!loading) {
                    event.preventDefault();
                    onCancel();
                }

                return;
            }

            if (
                event.key !== "Tab" ||
                !dialogRef.current
            ) {
                return;
            }

            const focusableElements = [
                ...dialogRef.current.querySelectorAll(
                    FOCUSABLE_SELECTOR
                ),
            ].filter(
                (element) =>
                    element instanceof HTMLElement &&
                    !element.hasAttribute("disabled")
            );

            if (focusableElements.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement =
                focusableElements[focusableElements.length - 1];

            if (
                event.shiftKey &&
                document.activeElement === firstElement
            ) {
                event.preventDefault();
                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow = previousOverflow;

            previouslyFocusedElementRef.current?.focus();
        };
    }, [loading, onCancel, open]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={
                    message ? descriptionId : undefined
                }
                aria-busy={loading || undefined}
                tabIndex={-1}
                className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="space-y-3">
                    <h2
                        id={titleId}
                        className="text-xl font-black text-slate-900"
                    >
                        {title}
                    </h2>

                    {message && (
                        <p
                            id={descriptionId}
                            className="text-sm leading-relaxed text-slate-700"
                        >
                            {message}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        ref={cancelButtonRef}
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {cancelText}
                    </Button>

                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        loading={loading}
                        loadingText="Arbetar..."
                        fullWidth
                        className="sm:w-auto"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;