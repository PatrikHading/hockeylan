import Button from "./Button";

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
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <div className="space-y-3">
                    <h2
                        id="confirm-dialog-title"
                        className="text-xl font-black text-slate-900"
                    >
                        {title}
                    </h2>

                    <p className="text-sm leading-relaxed text-slate-600">
                        {message}
                    </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
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
                        disabled={loading}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {loading ? "Arbetar..." : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;