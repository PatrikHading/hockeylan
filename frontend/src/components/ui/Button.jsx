import { forwardRef } from "react";

const Button = forwardRef(function Button(
    {
        children,
        type = "button",
        variant = "primary",
        size = "md",
        fullWidth = false,
        disabled = false,
        loading = false,
        loadingText = "Arbetar...",
        className = "",
        ...props
    },
    ref
) {
    const baseClasses =
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl " +
        "font-bold transition focus:outline-none focus:ring-2 " +
        "focus:ring-offset-2 disabled:cursor-not-allowed " +
        "disabled:opacity-60";

    const variantClasses = {
        primary:
            "bg-red-600 text-white shadow-sm hover:bg-red-700 " +
            "focus:ring-red-600",

        secondary:
            "bg-blue-950 text-white shadow-sm hover:bg-blue-900 " +
            "focus:ring-blue-950",

        outline:
            "border border-slate-300 bg-white text-slate-800 " +
            "hover:bg-slate-50 focus:ring-blue-950",

        ghost:
            "bg-transparent text-slate-700 hover:bg-slate-100 " +
            "focus:ring-blue-950",

        danger:
            "bg-red-700 text-white shadow-sm hover:bg-red-800 " +
            "focus:ring-red-700",
    };

    const sizeClasses = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-base",
    };

    const selectedVariant =
        variantClasses[variant] ?? variantClasses.primary;
    const selectedSize = sizeClasses[size] ?? sizeClasses.md;
    const isDisabled = disabled || loading;

    return (
        <button
            ref={ref}
            type={type}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={[
                baseClasses,
                selectedVariant,
                selectedSize,
                fullWidth ? "w-full" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...props}
        >
            {loading && (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                    aria-hidden="true"
                />
            )}

            <span>
                {loading ? loadingText : children}
            </span>
        </button>
    );
});

export default Button;