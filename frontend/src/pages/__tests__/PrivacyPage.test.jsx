import {
    render,
    screen,
} from "@testing-library/react";
import {
    describe,
    expect,
    test,
} from "vitest";
import PrivacyPage from "../PrivacyPage";

describe("PrivacyPage", () => {
    test("describes the personal data and processing purpose", () => {
        render(<PrivacyPage />);

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Så behandlar HockeyLån personuppgifter",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("låntagarens namn,"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("e-postadress,"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("telefonnummer,"),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Varför uppgifterna behandlas",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /uppgifterna används för att administrera utlåning/i,
            ),
        ).toBeInTheDocument();
    });

    test("describes necessary cookies and logging restrictions", () => {
        render(<PrivacyPage />);

        expect(
            screen.getByText(
                /tekniskt nödvändiga cookies/i,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /namn, e-postadress och telefonnummer ska inte skrivas/i,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /använder inte cookies för reklam/i,
            ),
        ).toBeInTheDocument();
    });

    test("marks unresolved business decisions", () => {
        render(<PrivacyPage />);

        expect(
            screen.getByText(
                "Verksamhetsbeslut krävs före produktion",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Informationen måste kompletteras",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /någon lagringstid anges inte här/i,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /rättslig grund för behandlingen/i,
            ),
        ).toBeInTheDocument();
    });
});