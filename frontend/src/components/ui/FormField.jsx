function FormField({
                       label,
                       id,
                       error,
                       helperText,
                       required = false,
                       children,
                   }) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-sm font-bold text-slate-800"
            >
                {label}

                {required && (
                    <span
                        className="ml-1 text-red-600"
                        aria-hidden="true"
                    >
            *
          </span>
                )}
            </label>

            {children}

            {helperText && !error && (
                <p className="text-xs text-slate-500">
                    {helperText}
                </p>
            )}

            {error && (
                <p
                    className="text-xs font-medium text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

export default FormField;