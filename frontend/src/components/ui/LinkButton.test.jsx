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
import LinkButton from "./LinkButton";

function renderLinkButton(
    properties = {}
) {
    return render(
        <MemoryRouter
            initialEntries={["/start"]}
        >
            <Routes>
                <Route
                    path="/start"
                    element={
                        <LinkButton
                            to="/destination"
                            {...properties}
                        >
                            Fortsätt
                        </LinkButton>
                    }
                />

                <Route
                    path="/destination"
                    element={
                        <p>
                            Destination
                        </p>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("LinkButton", () => {
    test("renders a link without nested button", () => {
        renderLinkButton();

        const link =
            screen.getByRole(
                "link",
                {
                    name: "Fortsätt",
                }
            );

        expect(link).toHaveAttribute(
            "href",
            "/destination"
        );

        expect(
            link.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole(
                "button"
            )
        ).not.toBeInTheDocument();
    });

    test("navigates with keyboard", async () => {
        const user =
            userEvent.setup();

        renderLinkButton();

        await user.tab();

        expect(
            screen.getByRole(
                "link",
                {
                    name: "Fortsätt",
                }
            )
        ).toHaveFocus();

        await user.keyboard(
            "{Enter}"
        );

        expect(
            await screen.findByText(
                "Destination"
            )
        ).toBeInTheDocument();
    });

    test("supports visual options and custom classes", () => {
        renderLinkButton({
            variant: "outline",
            size: "lg",
            fullWidth: true,
            className:
                "custom-class",
        });

        const link =
            screen.getByRole(
                "link",
                {
                    name: "Fortsätt",
                }
            );

        expect(link).toHaveClass(
            "border-slate-300",
            "px-5",
            "w-full",
            "custom-class"
        );
    });

    test("falls back safely for unknown visual options", () => {
        renderLinkButton({
            variant: "unknown",
            size: "unknown",
        });

        const link =
            screen.getByRole(
                "link",
                {
                    name: "Fortsätt",
                }
            );

        expect(link).toHaveClass(
            "bg-red-600",
            "px-4"
        );
    });
});