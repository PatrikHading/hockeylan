function Alert({
                   title,
                   children,
                   variant = "info",
                   className = "",
               }) {
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
            wrapper: "border-amber-200 bg-amber-50 text-amber-900",
            title: "text-amber-950",
        },

        danger: {
            wrapper: "border-red-200 bg-red-50 text-red-900",
            title: "text-red-950",
        },
    };

    return (
        <div
            role="alert"
            className={[
                "rounded-2xl border p-4 shadow-sm",
                variants[variant].wrapper,
                className,
            ].join(" ")}
        >
            {title && (
                <h3
                    className={[
                        "mb-1 text-sm font-bold",
                        variants[variant].title,
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