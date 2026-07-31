import { useId } from "react";

function Alert({
                   title,
                   children,
                   variant = "info",
                   className = "",
                   role,
                   live,
               }) {
    const generatedId = useId();
    const titleId = `alert-title-${generatedId}`;

    const variants = {
        info: {
            wrapper: "border-blue-200 bg-blue-50 text-blue-900",
            title: "text-blue-950",
        },

        success: {
            wrapper: "border-green-200 bg-green-50 text-green-900",
            title: "text-green-950",
        },

        warning: {
            wrapper: "border-amber-300 bg-amber-50 text-amber-950",
            title: "text-amber-950",
        },

        danger: {
            wrapper: "border-red-300 bg-red-50 text-red-950",
            title: "text-red-950",
        },
    };

    const selectedVariant = variants[variant] ?? variants.info;
    const resolvedRole =
        role ?? (variant === "danger" ? "alert" : "status");
    const resolvedLive =
        live ?? (variant === "danger" ? "assertive" : "polite");

    return (
        <div
            role={resolvedRole}
            aria-live={resolvedLive}
            aria-atomic="true"
            aria-labelledby={title ? titleId : undefined}
            className={[
                "rounded-2xl border p-4 shadow-sm",
                selectedVariant.wrapper,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {title && (
                <h3
                    id={titleId}
                    className={[
                        "mb-1 text-sm font-bold",
                        selectedVariant.title,
                    ].join(" ")}
                >
                    {title}
                </h3>
            )}

            <div className="text-sm leading-relaxed">
                {children}
            </div>
        </div>
    );
}

export default Alert;