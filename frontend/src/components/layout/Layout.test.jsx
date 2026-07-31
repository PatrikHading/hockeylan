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
import Layout from "./Layout";

function renderLayout(
    initialEntry = "/"
) {
    return render(
        <MemoryRouter
            initialEntries={[
                initialEntry,
            ]}
        >
            <Routes>
                <Route
                    element={<Layout />}
                >
                    <Route
                        path="/"
                        element={
                            <main>
                                Startsidan
                            </main>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <main>
                                Utrustningssidan
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

                    <Route
                        path="/integritet"
                        element={
                            <main>
                                Integritetssidan
                            </main>
                        }
                    />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe("Layout", () => {
    test("renders one main landmark supplied by current page", () => {
        renderLayout();

        expect(
            screen.getAllByRole(
                "main"
            )
        ).toHaveLength(1);

        expect(
            screen.getByRole(
                "main"
            )
        ).toHaveTextContent(
            "Startsidan"
        );
    });

    test("provides skip link to content container", async () => {
        const user =
            userEvent.setup();

        renderLayout();

        await user.tab();

        const skipLink =
            screen.getByRole(
                "link",
                {
                    name:
                        /hoppa till innehållet/i,
                }
            );

        expect(
            skipLink
        ).toHaveFocus();

        expect(
            skipLink
        ).toHaveAttribute(
            "href",
            "#main-content"
        );

        expect(
            document.getElementById(
                "main-content"
            )
        ).toHaveAttribute(
            "tabindex",
            "-1"
        );
    });

    test("marks current navigation link", () => {
        renderLayout(
            "/admin/loans"
        );

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                        "Lånehistorik",
                }
            )
        ).toHaveAttribute(
            "aria-current",
            "page"
        );

        expect(
            screen.getByRole(
                "link",
                {
                    name: "Start",
                }
            )
        ).not.toHaveAttribute(
            "aria-current"
        );
    });

    test("renders accessible brand and privacy links", () => {
        renderLayout();

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                        /hockeylån.*gå till startsidan/i,
                }
            )
        ).toHaveAttribute(
            "href",
            "/"
        );

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                        /integritet och personuppgifter/i,
                }
            )
        ).toHaveAttribute(
            "href",
            "/integritet"
        );
    });
});