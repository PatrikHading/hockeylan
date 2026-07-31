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
import NotFoundPage from "../NotFoundPage";

function renderNotFound() {
    return render(
        <MemoryRouter initialEntries={["/okand-sida"]}>
            <Routes>
                <Route
                    path="/"
                    element={<p>Startsida</p>}
                />

                <Route
                    path="/admin/login"
                    element={<p>Inloggningssida</p>}
                />

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("NotFoundPage", () => {
    test("explains that the requested page is missing", () => {
        renderNotFound();

        expect(
            screen.getByRole("heading", {
                name: "Sidan kunde inte hittas",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /adressen kan vara felaktig/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole("navigation", {
                name: /alternativ efter saknad sida/i,
            })
        ).toBeInTheDocument();
    });

    test("navigates to the home page", async () => {
        const user = userEvent.setup();

        renderNotFound();

        await user.click(
            screen.getByRole("link", {
                name: "Till startsidan",
            })
        );

        expect(
            screen.getByText("Startsida")
        ).toBeInTheDocument();
    });

    test("navigates to administrator login", async () => {
        const user = userEvent.setup();

        renderNotFound();

        await user.click(
            screen.getByRole("link", {
                name: "Administratörsinloggning",
            })
        );

        expect(
            screen.getByText("Inloggningssida")
        ).toBeInTheDocument();
    });

    test("supports keyboard navigation between actions", async () => {
        const user = userEvent.setup();

        renderNotFound();

        await user.tab();

        expect(
            screen.getByRole("link", {
                name: "Till startsidan",
            })
        ).toHaveFocus();

        await user.tab();

        expect(
            screen.getByRole("link", {
                name: "Administratörsinloggning",
            })
        ).toHaveFocus();
    });
});