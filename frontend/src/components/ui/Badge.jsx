function Badge({ children, variant = "default", className = "" }) {
    const variants = {
        default: "bg-slate-200 text-slate-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-amber-100 text-amber-800",
        danger: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        hockey: "bg-blue-950 text-white",
    };

    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide",
                variants[variant],
                className,
            ].join(" ")}
        >
      {children}
    </span>
    );
}

export default Badge;