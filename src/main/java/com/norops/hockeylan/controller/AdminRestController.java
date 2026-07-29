package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.AdminLoanResponseDTO;
import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.dto.EquipmentResponseDTO;
import com.norops.hockeylan.dto.QrCodeResponseDTO;
import com.norops.hockeylan.mapper.EquipmentMapper;
import com.norops.hockeylan.mapper.LoanMapper;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.EquipmentService;
import com.norops.hockeylan.service.LoanService;
import com.norops.hockeylan.util.QrCodeUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminRestController {

    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    private final EquipmentService equipmentService;
    private final LoanService loanService;

    @Value("${app.qr.base-url}")
    private String qrBaseUrl;

    @GetMapping("/equipment")
    public ResponseEntity<List<EquipmentResponseDTO>>
    getAllEquipment() {
        List<EquipmentResponseDTO> response =
                equipmentService.getAllEquipment()
                        .stream()
                        .map(EquipmentMapper::toResponseDTO)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/equipment")
    public ResponseEntity<EquipmentResponseDTO> addEquipment(
            @Valid @RequestBody EquipmentDTO equipmentDTO
    ) {
        Equipment equipment =
                equipmentService.addEquipment(equipmentDTO);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(EquipmentMapper.toResponseDTO(equipment));
    }

    @GetMapping("/equipment/{id}/qr")
    public ResponseEntity<QrCodeResponseDTO> getQrCode(
            @PathVariable Long id
    ) {
        Equipment equipment =
                equipmentService.getEquipmentById(id);

        String encodedSerialNumber = UriUtils.encodePathSegment(
                equipment.getSerialNumber(),
                StandardCharsets.UTF_8
        );

        String frontendBaseUrl =
                removeTrailingSlash(qrBaseUrl);

        String loanUrl =
                frontendBaseUrl + "/loan/" + encodedSerialNumber;

        String qrCodeBase64 = QrCodeUtil.generateQrCodeBase64(
                loanUrl,
                QR_WIDTH,
                QR_HEIGHT
        );

        QrCodeResponseDTO response = new QrCodeResponseDTO(
                equipment.getSerialNumber(),
                equipment.getType(),
                equipment.getDescription(),
                equipment.isAvailable(),
                loanUrl,
                qrCodeBase64
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/loans/active")
    public ResponseEntity<List<AdminLoanResponseDTO>>
    getActiveLoans() {
        List<AdminLoanResponseDTO> response =
                loanService.getActiveLoans()
                        .stream()
                        .map(LoanMapper::toAdminResponseDTO)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/loans/{loanId}/returned")
    public ResponseEntity<AdminLoanResponseDTO> markLoanReturned(
            @PathVariable Long loanId
    ) {
        Loan returnedLoan =
                loanService.markReturned(loanId);

        return ResponseEntity.ok(
                LoanMapper.toAdminResponseDTO(returnedLoan)
        );
    }

    @PutMapping("/equipment/{id}/returned")
    public ResponseEntity<EquipmentResponseDTO> markAsReturned(
            @PathVariable Long id
    ) {
        Equipment equipment =
                equipmentService.getEquipmentById(id);

        Equipment returnedEquipment =
                loanService.markReturned(equipment);

        return ResponseEntity.ok(
                EquipmentMapper.toResponseDTO(returnedEquipment)
        );
    }

    private String removeTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }

        return url.endsWith("/")
                ? url.substring(0, url.length() - 1)
                : url;
    }
}