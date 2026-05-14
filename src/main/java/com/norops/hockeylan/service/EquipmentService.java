package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    @Transactional(readOnly = true)
    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Equipment getEquipmentBySerialNumber(String serialNumber) {
        String sanitizedSerialNumber = sanitizeSerialNumber(serialNumber);

        return equipmentRepository.findBySerialNumberIgnoreCase(sanitizedSerialNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found with serial number: " + sanitizedSerialNumber
                ));
    }

    public Equipment addEquipment(EquipmentDTO equipmentDTO) {
        String sanitizedSerialNumber = sanitizeSerialNumber(equipmentDTO.getSerialNumber());
        String sanitizedDescription = InputSanitizer.cleanText(equipmentDTO.getDescription());

        if (equipmentRepository.existsBySerialNumberIgnoreCase(sanitizedSerialNumber)) {
            throw new DuplicateResourceException("Equipment with serial number already exists: " + sanitizedSerialNumber);
        }

        Equipment equipment = new Equipment(
                equipmentDTO.getType(),
                sanitizedSerialNumber,
                sanitizedDescription
        );

        return equipmentRepository.save(equipment);
    }

    public Equipment updateAvailability(Long id, boolean available) {
        Equipment equipment = getEquipmentById(id);
        equipment.setAvailable(available);
        return equipment;
    }

    public void deleteEquipment(Long id) {
        Equipment equipment = getEquipmentById(id);
        equipmentRepository.delete(equipment);
    }

    private String sanitizeSerialNumber(String serialNumber) {
        String sanitizedSerialNumber = InputSanitizer.cleanSerialNumber(serialNumber);

        if (sanitizedSerialNumber == null || sanitizedSerialNumber.isBlank()) {
            throw new IllegalArgumentException("Serial number must not be blank");
        }

        return sanitizedSerialNumber;
    }
}