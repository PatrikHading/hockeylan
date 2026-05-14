package com.norops.hockeylan.util;

public final class InputSanitizer {

    private InputSanitizer() {
    }

    public static String cleanText(String value) {
        if (value == null) {
            return null;
        }

        return value
                .trim()
                .replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "")
                .replaceAll("\\s+", " ");
    }

    public static String cleanSerialNumber(String value) {
        String cleaned = cleanText(value);

        if (cleaned == null) {
            return null;
        }

        return cleaned.toUpperCase();
    }

    public static String cleanEmail(String value) {
        String cleaned = cleanText(value);

        if (cleaned == null) {
            return null;
        }

        return cleaned.toLowerCase();
    }

    public static String cleanPhoneNumber(String value) {
        return cleanText(value);
    }
}