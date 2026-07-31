const SERIAL_NUMBER_PATTERN =
    /^[A-Za-z0-9_-]{2,50}$/;

export function extractLoanSerialNumber(
    decodedText
) {
    if (
        typeof decodedText !== "string" ||
        !decodedText.trim()
    ) {
        throw new Error(
            "QR-koden saknar innehåll."
        );
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(
            decodedText.trim(),
            window.location.origin
        );
    } catch {
        throw new Error(
            "QR-koden innehåller ingen giltig adress."
        );
    }

    if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
    ) {
        throw new Error(
            "QR-koden använder ett otillåtet protokoll."
        );
    }

    const pathParts = parsedUrl.pathname
        .split("/")
        .filter(Boolean);

    if (
        pathParts.length !== 2 ||
        pathParts[0].toLowerCase() !== "loan"
    ) {
        throw new Error(
            "QR-koden leder inte till ett låneformulär."
        );
    }

    let serialNumber;

    try {
        serialNumber = decodeURIComponent(
            pathParts[1]
        ).trim();
    } catch {
        throw new Error(
            "QR-kodens serienummer kunde inte läsas."
        );
    }

    if (
        !SERIAL_NUMBER_PATTERN.test(
            serialNumber
        )
    ) {
        throw new Error(
            "QR-koden innehåller ett ogiltigt serienummer."
        );
    }

    return serialNumber.toUpperCase();
}