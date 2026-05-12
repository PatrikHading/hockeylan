function Button({
                    children,
                    type = "button",
                    variant = "primary",
                    size = "md",
                    fullWidth = false,
                    disabled = false,
                    className = "",
                    ...props
                }) {
    const baseClasses =
        "inline-flex items-center justify-center rounded-xl font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

    const variantClasses = {
        primary:
            "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-600",
        secondary:
            "bg-blue-950 text-white shadow-sm hover:bg-blue-900 focus:ring-blue-950",
        outline:
            "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-blue-950",
        ghost:
            "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-blue-950",
        danger:
            "bg-red-700 text-white shadow-sm hover:bg-red-800 focus:ring-red-700",
    };

    const sizeClasses = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-base",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            type={type}
            disabled={disabled}
            className={[
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                widthClass,
                className,
            ].join(" ")}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;