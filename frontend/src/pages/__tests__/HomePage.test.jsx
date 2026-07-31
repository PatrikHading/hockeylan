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
import HomePage from "../HomePage";

function renderHomePage() {
    return render(
        <MemoryRouter
            initialEntries={["/"]}
        >
            <Routes>
                <Route
                    path="/"
                    element={<HomePage />}
                />

                <Route
                    path="/scan"
                    element={
                        <main>
                            QR-skanner
                        </main>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <main>
                            Adminpanel
                        </main>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("HomePage", () => {
    test("renders homepage content in main landmark", () => {
        renderHomePage();

        const main =
            screen.getByRole("main");

        expect(main).toHaveAccessibleName(
            "HockeyLån"
        );

        expect(
            screen.getByRole(
                "heading",
                {
                    level: 1,
                    name: "HockeyLån",
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /hantera hockeyutrustning snabbt och enkelt/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole(
                "heading",
                {
                    name:
                        /så fungerar det/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole("list")
        ).toHaveTextContent(
            /skanna qr-koden/i
        );
    });

    test("renders links without nested buttons", () => {
        renderHomePage();

        const scannerLink =
            screen.getByRole(
                "link",
                {
                    name:
                        /skanna qr-kod/i,
                }
            );

        const adminLink =
            screen.getByRole(
                "link",
                {
                    name:
                        /öppna adminpanel/i,
                }
            );

        expect(
            scannerLink
        ).toHaveAttribute(
            "href",
            "/scan"
        );

        expect(
            adminLink
        ).toHaveAttribute(
            "href",
            "/admin"
        );

        expect(
            scannerLink.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();

        expect(
            adminLink.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();
    });

    test("supports keyboard navigation to scanner", async () => {
        const user =
            userEvent.setup();

        renderHomePage();

        await user.tab();

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                        /skanna qr-kod/i,
                }
            )
        ).toHaveFocus();

        await user.keyboard(
            "{Enter}"
        );

        expect(
            await screen.findByText(
                "QR-skanner"
            )
        ).toBeInTheDocument();
    });
});