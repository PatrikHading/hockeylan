import { Link } from "react-router";

function LinkButton({
                        children,
                        to,
                        variant = "primary",
                        size = "md",
                        fullWidth = false,
                        className = "",
                        ...props
                    }) {
    const baseClasses =
        "inline-flex min-h-11 items-center justify-center rounded-xl " +
        "font-bold transition focus:outline-none focus:ring-2 " +
        "focus:ring-offset-2";

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
        variantClasses[variant] ??
        variantClasses.primary;

    const selectedSize =
        sizeClasses[size] ??
        sizeClasses.md;

    return (
        <Link
            to={to}
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
            {children}
        </Link>
    );
}

export default LinkButton;