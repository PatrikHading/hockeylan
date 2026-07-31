import {
    Children,
    cloneElement,
    isValidElement,
} from "react";

function joinDescriptionIds(...values) {
    return [
        ...new Set(
            values
                .flatMap((value) =>
                    typeof value === "string"
                        ? value.split(/\s+/)
                        : []
                )
                .filter(Boolean)
        ),
    ].join(" ");
}

function FormField({
                       label,
                       id,
                       error,
                       helperText,
                       required = false,
                       children,
                   }) {
    const helperId = `${id}-help`;
    const errorId = `${id}-error`;

    const child = Children.only(children);

    const describedBy = joinDescriptionIds(
        isValidElement(child)
            ? child.props["aria-describedby"]
            : undefined,
        helperText && !error ? helperId : undefined,
        error ? errorId : undefined
    );

    const control = isValidElement(child)
        ? cloneElement(child, {
            id: child.props.id ?? id,
            required: child.props.required ?? required,
            "aria-required":
                child.props["aria-required"] ??
                (required || undefined),
            "aria-invalid":
                child.props["aria-invalid"] ??
                (Boolean(error) || undefined),
            "aria-describedby":
                describedBy || undefined,
        })
        : child;

    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-sm font-bold text-slate-800"
            >
                {label}

                {required && (
                    <>
                        <span
                            className="ml-1 text-red-700"
                            aria-hidden="true"
                        >
                            *
                        </span>

                        <span className="sr-only">
                            {" "}
                            obligatoriskt
                        </span>
                    </>
                )}
            </label>

            {control}

            {helperText && !error && (
                <p
                    id={helperId}
                    className="text-xs text-slate-600"
                >
                    {helperText}
                </p>
            )}

            {error && (
                <p
                    id={errorId}
                    className="text-xs font-semibold text-red-700"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

export default FormField;