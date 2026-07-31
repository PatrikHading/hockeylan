import {
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    MemoryRouter,
    Route,
    Routes,
} from "react-router";
import {
    describe,
    expect,
    test,
} from "vitest";
import ThankYou from "../ThankYou";

const successState = {
    loanId: 42,
    equipmentType:
        "COMPLETE_KIT",
    serialNumber:
        "KIT-2026-001",
    borrowerName:
        "Patrik Hading",
    loanDate:
        "2026-07-30T12:00:00",
    expectedReturnDate:
        "2027-04-30",
};

function renderWithState(
    state = successState
) {
    return render(
        <MemoryRouter
            initialEntries={[
                {
                    pathname:
                        "/loan/success",
                    state,
                },
            ]}
        >
            <Routes>
                <Route
                    path="/loan/success"
                    element={<ThankYou />}
                />

                <Route
                    path="/admin"
                    element={
                        <main>
                            Adminvyn
                        </main>
                    }
                />

                <Route
                    path="/admin/loans"
                    element={
                        <main>
                            Lånehistoriken
                        </main>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("ThankYou", () => {
    test("renders registered loan summary in main landmark", () => {
        renderWithState();

        expect(
            screen.getByRole(
                "main",
                {
                    name:
                        /registreringen är klar/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /utrustningen är nu markerad som utlånad/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText("42")
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Komplett utrustning"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "KIT-2026-001"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Patrik Hading"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /30 juli 2026|30 jul/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /30 april 2027|30 apr/i
            )
        ).toBeInTheDocument();
    });

    test("renders administrator links without nested buttons", () => {
        renderWithState();

        const equipmentLink =
            screen.getByRole(
                "link",
                {
                    name:
                        /till utrustningen/i,
                }
            );

        const historyLink =
            screen.getByRole(
                "link",
                {
                    name:
                        /visa lånehistorik/i,
                }
            );

        expect(
            equipmentLink
        ).toHaveAttribute(
            "href",
            "/admin"
        );

        expect(
            historyLink
        ).toHaveAttribute(
            "href",
            "/admin/loans"
        );

        expect(
            equipmentLink.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();

        expect(
            historyLink.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                "navigation",
                {
                    name:
                        /fortsätt efter registrerat lån/i,
                }
            )
        ).toBeInTheDocument();
    });

    test("supports keyboard navigation after registration", async () => {
        const user =
            userEvent.setup();

        renderWithState();

        await user.tab();

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                        /till utrustningen/i,
                }
            )
        ).toHaveFocus();

        await user.keyboard(
            "{Enter}"
        );

        expect(
            await screen.findByText(
                "Adminvyn"
            )
        ).toBeInTheDocument();
    });

    test("shows warning and valid navigation when state is missing", () => {
        renderWithState(null);

        expect(
            screen.getByRole(
                "main",
                {
                    name:
                        /lånesammanfattning saknas/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /ingen lånesammanfattning/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /öppna ett registrerat lån från administratörsvyn/i
            )
        ).toBeInTheDocument();

        const link =
            screen.getByRole(
                "link",
                {
                    name:
                        /till adminvyn/i,
                }
            );

        expect(link).toHaveAttribute(
            "href",
            "/admin"
        );

        expect(
            link.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();
    });
});