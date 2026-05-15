package com.norops.hockeylan.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class InputSanitizerTest {

    @Test
    void cleanTextShouldTrimCollapseWhitespaceAndRemoveControlCharacters() {
        String result = InputSanitizer.cleanText("  Bauer\u0000   hjälm\t medium  ");

        assertEquals("Bauer hjälm medium", result);
    }

    @Test
    void cleanTextShouldReturnNullWhenValueIsNull() {
        assertNull(InputSanitizer.cleanText(null));
    }

    @Test
    void cleanSerialNumberShouldTrimAndUppercaseValue() {
        String result = InputSanitizer.cleanSerialNumber("  helmet-001  ");

        assertEquals("HELMET-001", result);
    }

    @Test
    void cleanEmailShouldTrimAndLowercaseValue() {
        String result = InputSanitizer.cleanEmail("  Patrik.Example@MAIL.COM  ");

        assertEquals("patrik.example@mail.com", result);
    }

    @Test
    void cleanPhoneNumberShouldKeepValidFormattingButTrimValue() {
        String result = InputSanitizer.cleanPhoneNumber("  +46 (70) 123-45 67  ");

        assertEquals("+46 (70) 123-45 67", result);
    }
}