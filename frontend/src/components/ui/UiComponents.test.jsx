import { useState } from "react";
import {
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    describe,
    expect,
    test,
    vi,
} from "vitest";
import Alert from "./Alert";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import FormField from "./FormField";

describe("Alert", () => {
    test("renders danger messages as assertive alerts", () => {
        render(
            <Alert
                title="Något gick fel"
                variant="danger"
            >
                Försök igen senare.
            </Alert>
        );

        const alert = screen.getByRole("alert", {
            name: "Något gick fel",
        });

        expect(alert).toHaveAttribute(
            "aria-live",
            "assertive"
        );
        expect(alert).toHaveAttribute(
            "aria-atomic",
            "true"
        );
        expect(alert).toHaveTextContent(
            "Försök igen senare."
        );
    });

    test("renders informational messages as polite status updates", () => {
        render(
            <Alert
                title="Information"
                variant="info"
            >
                Utrustningen har uppdaterats.
            </Alert>
        );

        const status = screen.getByRole("status", {
            name: "Information",
        });

        expect(status).toHaveAttribute(
            "aria-live",
            "polite"
        );
    });

    test("falls back safely for an unknown variant", () => {
        render(
            <Alert variant="unknown">
                Ett meddelande
            </Alert>
        );

        expect(
            screen.getByRole("status")
        ).toHaveTextContent("Ett meddelande");
    });
});

describe("Button", () => {
    test("uses button as the default type", () => {
        render(<Button>Spara</Button>);

        expect(
            screen.getByRole("button", {
                name: "Spara",
            })
        ).toHaveAttribute("type", "button");
    });

    test("prevents interaction while loading", async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <Button
                loading
                loadingText="Sparar..."
                onClick={handleClick}
            >
                Spara
            </Button>
        );

        const button = screen.getByRole("button", {
            name: "Sparar...",
        });

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute(
            "aria-busy",
            "true"
        );

        await user.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    test("forwards its ref", () => {
        const ref = { current: null };

        render(
            <Button ref={ref}>
                Fokuserbar knapp
            </Button>
        );

        expect(ref.current).toBeInstanceOf(
            HTMLButtonElement
        );
    });
});

describe("FormField", () => {
    test("associates label and helper text with the control", () => {
        render(
            <FormField
                id="serial-number"
                label="Serienummer"
                helperText="Finns på utrustningens etikett."
                required
            >
                <input />
            </FormField>
        );

        const input = screen.getByRole("textbox", {
            name: /serienummer/i,
        });

        expect(input).toHaveAttribute(
            "id",
            "serial-number"
        );
        expect(input).toBeRequired();
        expect(input).toHaveAttribute(
            "aria-required",
            "true"
        );
        expect(input).toHaveAttribute(
            "aria-describedby",
            "serial-number-help"
        );

        expect(
            screen.getByText(
                "Finns på utrustningens etikett."
            )
        ).toHaveAttribute(
            "id",
            "serial-number-help"
        );
    });

    test("associates validation errors with the control", () => {
        render(
            <FormField
                id="borrower-name"
                label="Låntagarens namn"
                error="Namnet måste anges."
            >
                <input />
            </FormField>
        );

        const input = screen.getByRole("textbox", {
            name: "Låntagarens namn",
        });

        expect(input).toHaveAttribute(
            "aria-invalid",
            "true"
        );
        expect(input).toHaveAttribute(
            "aria-describedby",
            "borrower-name-error"
        );

        expect(
            screen.getByRole("alert")
        ).toHaveAttribute(
            "id",
            "borrower-name-error"
        );
    });

    test("preserves an existing aria description", () => {
        render(
            <>
                <p id="external-description">
                    Extern beskrivning
                </p>

                <FormField
                    id="email"
                    label="E-post"
                    error="Ogiltig e-postadress."
                >
                    <input
                        aria-describedby="external-description"
                    />
                </FormField>
            </>
        );

        expect(
            screen.getByRole("textbox", {
                name: "E-post",
            })
        ).toHaveAttribute(
            "aria-describedby",
            "external-description email-error"
        );
    });
});

describe("ConfirmDialog", () => {
    test("does not render when closed", () => {
        render(
            <ConfirmDialog
                open={false}
                message="Är du säker?"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(
            screen.queryByRole("dialog")
        ).not.toBeInTheDocument();
    });

    test("connects title and description to the dialog", () => {
        render(
            <ConfirmDialog
                open
                title="Återlämna utrustning"
                message="Utrustningen markeras som tillgänglig."
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        const dialog = screen.getByRole("dialog", {
            name: "Återlämna utrustning",
        });

        const description = screen.getByText(
            "Utrustningen markeras som tillgänglig."
        );

        expect(dialog).toHaveAttribute(
            "aria-modal",
            "true"
        );
        expect(dialog).toHaveAttribute(
            "aria-describedby",
            description.id
        );
    });

    test("places initial focus on the cancel button", async () => {
        render(
            <ConfirmDialog
                open
                message="Är du säker?"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(
                screen.getByRole("button", {
                    name: "Avbryt",
                })
            ).toHaveFocus();
        });
    });

    test("closes with Escape when not loading", async () => {
        const user = userEvent.setup();
        const handleCancel = vi.fn();

        render(
            <ConfirmDialog
                open
                message="Är du säker?"
                onConfirm={vi.fn()}
                onCancel={handleCancel}
            />
        );

        await user.keyboard("{Escape}");

        expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    test("does not close with Escape while loading", async () => {
        const user = userEvent.setup();
        const handleCancel = vi.fn();

        render(
            <ConfirmDialog
                open
                loading
                message="Är du säker?"
                onConfirm={vi.fn()}
                onCancel={handleCancel}
            />
        );

        await user.keyboard("{Escape}");

        expect(handleCancel).not.toHaveBeenCalled();
    });

    test("disables both actions while confirmation is running", () => {
        render(
            <ConfirmDialog
                open
                loading
                message="Är du säker?"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Avbryt",
            })
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Arbetar...",
            })
        ).toBeDisabled();

        expect(
            screen.getByRole("dialog")
        ).toHaveAttribute(
            "aria-busy",
            "true"
        );
    });

    test("restores focus when the dialog closes", async () => {
        const user = userEvent.setup();

        function DialogHarness() {
            const [open, setOpen] = useState(false);

            return (
                <>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                    >
                        Öppna dialog
                    </button>

                    <ConfirmDialog
                        open={open}
                        message="Är du säker?"
                        onConfirm={vi.fn()}
                        onCancel={() => setOpen(false)}
                    />
                </>
            );
        }

        render(<DialogHarness />);

        const opener = screen.getByRole("button", {
            name: "Öppna dialog",
        });

        await user.click(opener);

        await waitFor(() => {
            expect(
                screen.getByRole("button", {
                    name: "Avbryt",
                })
            ).toHaveFocus();
        });

        await user.keyboard("{Escape}");

        await waitFor(() => {
            expect(opener).toHaveFocus();
        });
    });

    test("keeps keyboard focus inside the dialog", async () => {
        const user = userEvent.setup();

        render(
            <ConfirmDialog
                open
                message="Är du säker?"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        const cancelButton = screen.getByRole(
            "button",
            {
                name: "Avbryt",
            }
        );

        const confirmButton = screen.getByRole(
            "button",
            {
                name: "Bekräfta",
            }
        );

        await waitFor(() => {
            expect(cancelButton).toHaveFocus();
        });

        await user.tab();
        expect(confirmButton).toHaveFocus();

        await user.tab();
        expect(cancelButton).toHaveFocus();

        await user.tab({ shift: true });
        expect(confirmButton).toHaveFocus();
    });
});