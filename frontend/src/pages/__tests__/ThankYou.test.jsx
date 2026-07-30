import {
    render,
    screen,
} from "@testing-library/react";
import {
    MemoryRouter,
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
            <ThankYou />
        </MemoryRouter>
    );
}

describe("ThankYou", () => {
    test(
        "renders registered loan summary",
        () => {
            renderWithState();

            expect(
                screen.getByRole(
                    "heading",
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
        }
    );

    test(
        "renders administrator navigation links",
        () => {
            renderWithState();

            expect(
                screen.getByRole(
                    "link",
                    {
                        name:
                            /till utrustningen/i,
                    }
                )
            ).toHaveAttribute(
                "href",
                "/admin"
            );

            expect(
                screen.getByRole(
                    "link",
                    {
                        name:
                            /visa lånehistorik/i,
                    }
                )
            ).toHaveAttribute(
                "href",
                "/admin/loans"
            );
        }
    );

    test(
        "shows warning when navigation state is missing",
        () => {
            renderWithState(null);

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

            expect(
                screen.getByRole(
                    "link",
                    {
                        name:
                            /till adminvyn/i,
                    }
                )
            ).toHaveAttribute(
                "href",
                "/admin"
            );
        }
    );
});