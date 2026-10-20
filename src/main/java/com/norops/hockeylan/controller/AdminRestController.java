package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.AdminLoanResponseDTO;
import com.norops.hockeylan.dto.EquipmentActiveDTO;
import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.dto.EquipmentResponseDTO;
import com.norops.hockeylan.dto.LoanHistoryStatus;
import com.norops.hockeylan.dto.PagedResponseDTO;
import com.norops.hockeylan.dto.QrCodeResponseDTO;
import com.norops.hockeylan.mapper.EquipmentMapper;
import com.norops.hockeylan.mapper.LoanMapper;
import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.EquipmentService;
import com.norops.hockeylan.service.LoanService;
import com.norops.hockeylan.util.QrCodeUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Validated
public class AdminRestController {

    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    private final EquipmentService
            equipmentService;

    private final LoanService loanService;

    private final Clock clock;

    @Value("${app.qr.base-url}")
    private String qrBaseUrl;

    @GetMapping("/equipment")
    public ResponseEntity<
            List<EquipmentResponseDTO>
            > getAllEquipment(
            @RequestParam(required = false)
            @Size(
                    max = 100,
                    message =
                            "Search query must be max 100 characters"
            )
            String query,

            @RequestParam(required = false)
            EquipmentType type,

            @RequestParam(required = false)
            EquipmentCondition condition,

            @RequestParam(required = false)
            AgeCategory ageCategory,

            @RequestParam(required = false)
            Boolean active,

            @RequestParam(required = false)
            Boolean available
    ) {
        List<EquipmentResponseDTO> response =
                equipmentService
                        .searchEquipment(
                                query,
                                type,
                                condition,
                                ageCategory,
                                active,
                                available
                        )
                        .stream()
                        .map(
                                EquipmentMapper
                                        ::toResponseDTO
                        )
                        .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/equipment/{id}")
    public ResponseEntity<EquipmentResponseDTO>
    getEquipmentById(
            @PathVariable Long id
    ) {
        Equipment equipment =
                equipmentService
                        .getEquipmentById(id);

        return ResponseEntity.ok(
                EquipmentMapper.toResponseDTO(
                        equipment
                )
        );
    }

    @PostMapping("/equipment")
    public ResponseEntity<EquipmentResponseDTO>
    addEquipment(
            @Valid
            @RequestBody
            EquipmentDTO equipmentDTO
    ) {
        Equipment equipment =
                equipmentService.addEquipment(
                        equipmentDTO
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        EquipmentMapper
                                .toResponseDTO(
                                        equipment
                                )
                );
    }

    @PutMapping("/equipment/{id}")
    public ResponseEntity<EquipmentResponseDTO>
    updateEquipment(
            @PathVariable Long id,
            @Valid
            @RequestBody
            EquipmentDTO equipmentDTO
    ) {
        Equipment equipment =
                equipmentService
                        .updateEquipment(
                                id,
                                equipmentDTO
                        );

        return ResponseEntity.ok(
                EquipmentMapper.toResponseDTO(
                        equipment
                )
        );
    }

    @PutMapping("/equipment/{id}/active")
    public ResponseEntity<EquipmentResponseDTO>
    updateEquipmentActiveStatus(
            @PathVariable Long id,
            @Valid
            @RequestBody
            EquipmentActiveDTO request
    ) {
        Equipment equipment =
                equipmentService
                        .updateActiveStatus(
                                id,
                                request.active()
                        );

        return ResponseEntity.ok(
                EquipmentMapper.toResponseDTO(
                        equipment
                )
        );
    }

    @GetMapping("/equipment/{id}/qr")
    public ResponseEntity<QrCodeResponseDTO>
    getQrCode(
            @PathVariable Long id
    ) {
        Equipment equipment =
                equipmentService
                        .getEquipmentById(id);

        String encodedSerialNumber =
                UriUtils.encodePathSegment(
                        equipment
                                .getSerialNumber(),
                        StandardCharsets.UTF_8
                );

        String frontendBaseUrl =
                removeTrailingSlash(qrBaseUrl);

        String loanUrl =
                frontendBaseUrl
                        + "/loan/"
                        + encodedSerialNumber;

        String qrCodeBase64 =
                QrCodeUtil
                        .generateQrCodeBase64(
                                loanUrl,
                                QR_WIDTH,
                                QR_HEIGHT
                        );

        QrCodeResponseDTO response =
                new QrCodeResponseDTO(
                        equipment
                                .getSerialNumber(),
                        equipment.getType(),
                        equipment.getSize(),
                        equipment.getBrand(),
                        equipment.getModel(),
                        equipment.getCondition(),
                        equipment
                                .getAgeCategory(),
                        equipment.getDescription(),
                        equipment.isAvailable(),
                        equipment.isActive(),
                        loanUrl,
                        qrCodeBase64
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/loans")
    public ResponseEntity<
            PagedResponseDTO<
                    AdminLoanResponseDTO
                    >
            > getLoanHistory(
            @RequestParam(
                    defaultValue = "ALL"
            )
            LoanHistoryStatus status,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso =
                            DateTimeFormat
                                    .ISO.DATE
            )
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso =
                            DateTimeFormat
                                    .ISO.DATE
            )
            LocalDate to,

            @RequestParam(required = false)
            @Size(max = 100)
            String serialNumber,

            @RequestParam(required = false)
            EquipmentType equipmentType,

            @RequestParam(required = false)
            @Size(max = 100)
            String borrower,

            @RequestParam(
                    defaultValue = "0"
            )
            @Min(0)
            int page,

            @RequestParam(
                    defaultValue = "20"
            )
            @Min(1)
            @Max(100)
            int size
    ) {
        LocalDate currentDate =
                LocalDate.now(clock);

        return ResponseEntity.ok(
                PagedResponseDTO.from(
                        loanService
                                .getLoanHistory(
                                        status,
                                        from,
                                        to,
                                        serialNumber,
                                        equipmentType,
                                        borrower,
                                        page,
                                        size
                                ),
                        loan ->
                                LoanMapper
                                        .toAdminResponseDTO(
                                                loan,
                                                currentDate
                                        )
                )
        );
    }

    @PutMapping("/loans/{loanId}/returned")
    public ResponseEntity<
            AdminLoanResponseDTO
            > markLoanReturned(
            @PathVariable Long loanId
    ) {
        Loan returnedLoan =
                loanService.markReturned(
                        loanId
                );

        return ResponseEntity.ok(
                LoanMapper
                        .toAdminResponseDTO(
                                returnedLoan,
                                LocalDate.now(clock)
                        )
        );
    }

    private String removeTrailingSlash(
            String url
    ) {
        if (
                url == null
                        || url.isBlank()
        ) {
            return "";
        }

        return url.endsWith("/")
                ? url.substring(
                0,
                url.length() - 1
        )
                : url;
    }
}