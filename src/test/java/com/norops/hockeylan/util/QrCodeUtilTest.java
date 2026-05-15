package com.norops.hockeylan.util;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class QrCodeUtilTest {

    private static final byte[] PNG_SIGNATURE = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    @Test
    void generateQrCodePngShouldReturnPngBytes() {
        byte[] result = QrCodeUtil.generateQrCodePng(
                "http://localhost:5173/loan/HELMET-001",
                120,
                120
        );

        assertNotNull(result);
        assertFalse(result.length == 0);
        assertArrayEquals(
                PNG_SIGNATURE,
                Arrays.copyOf(result, PNG_SIGNATURE.length)
        );
    }

    @Test
    void generateQrCodeBase64ShouldReturnBase64EncodedPng() {
        String result = QrCodeUtil.generateQrCodeBase64("HELMET-001", 120, 120);

        byte[] decoded = Base64.getDecoder().decode(result);

        assertFalse(result.isBlank());
        assertArrayEquals(
                PNG_SIGNATURE,
                Arrays.copyOf(decoded, PNG_SIGNATURE.length)
        );
    }
}