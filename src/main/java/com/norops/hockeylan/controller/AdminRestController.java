package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.service.EquipmentService;
import com.norops.hockeylan.service.LoanService;
import com.norops.hockeylan.util.QrCodeUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

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
    public List<Equipment> getAllEquipment() {
        return equipmentService.getAllEquipment();
    }

    @PostMapping("/equipment")
    public Equipment addEquipment(@Valid @RequestBody EquipmentDTO equipmentDTO) {
        return equipmentService.addEquipment(equipmentDTO);
    }

    @GetMapping("/equipment/{id}/qr")
    public Map<String, String> getQrCode(@PathVariable Long id) {
        Equipment equipment = equipmentService.getEquipmentById(id);

        String loanUrl = qrBaseUrl + "/loan/" + equipment.getSerialNumber();
        String qrCodeBase64 = QrCodeUtil.generateQrCodeBase64(loanUrl, QR_WIDTH, QR_HEIGHT);

        return Map.of(
                "serialNumber", equipment.getSerialNumber(),
                "loanUrl", loanUrl,
                "qrCodeBase64", qrCodeBase64
        );
    }

    @PutMapping("/equipment/{id}/returned")
    public Equipment markAsReturned(@PathVariable Long id) {
        Equipment equipment = equipmentService.getEquipmentById(id);
        loanService.markReturned(equipment);

        return equipmentService.getEquipmentById(id);
    }


}
