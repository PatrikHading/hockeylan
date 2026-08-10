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
    test("renders named main landmark and page heading", () => {
        render(<PrivacyPage />);

        expect(
            screen.getByRole("main", {
                name: "Så behandlar HockeyLån personuppgifter",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Så behandlar HockeyLån personuppgifter",
            }),
        ).toBeInTheDocument();
    });

    test("describes personal data and processing purpose", () => {
        render(<PrivacyPage />);

        expect(
            screen.getByText(
                "låntagarens namn,",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "e-postadress,",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "telefonnummer,",
            ),
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

        expect(
            screen.getByText(
                /eventuellt förväntat återlämningsdatum/i,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /aliasnamnet tillsammans med en återanvändbar kopia/i,
            ),
        ).toHaveTextContent(
            /namn, e-postadress och telefonnummer/i,
        );

        expect(
            screen.getByText(
                /ett alias behöver inte väljas eller sparas/i,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /ändringen endast det aktuella lånet/i,
            ),
        ).toHaveTextContent(
            /ändrar inte det sparade Aliaset/i,
        );
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
                /namn, e-postadress, telefonnummer och aliasnamn ska inte skrivas/i,
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /använder inte cookies för reklam/i,
            ),
        ).toBeInTheDocument();
    });

    test("marks unresolved business decisions as notes", () => {
        render(<PrivacyPage />);

        expect(
            screen.getByRole("note", {
                name: /verksamhetsbeslut krävs/i,
            }),
        ).toHaveTextContent(
            /lagringstid.*raderingsrutin/i,
        );

        expect(
            screen.getByRole("note", {
                name: /informationen måste kompletteras/i,
            }),
        ).toHaveTextContent(
            /rättslig grund för behandlingen/i,
        );

        expect(
            screen.getByText(
                /någon lagringstid anges inte här/i,
            ),
        ).toHaveTextContent(
            /låneuppgifter samt sparade Alias/i,
        );

        expect(
            screen.getByRole("note", {
                name: /verksamhetsbeslut krävs/i,
            }),
        ).toHaveTextContent(
            /raderingsrutin för både låneuppgifter och Alias/i,
        );
    });
});