package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.repository.EquipmentRepository;
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
        String normalizedSerialNumber = normalizeSerialNumber(serialNumber);

        return equipmentRepository.findBySerialNumberIgnoreCase(normalizedSerialNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found with serial number: " + normalizedSerialNumber
                ));
    }

    public Equipment addEquipment(EquipmentDTO equipmentDTO) {
        String normalizedSerialNumber = normalizeSerialNumber(equipmentDTO.getSerialNumber());

        if (equipmentRepository.existsBySerialNumberIgnoreCase(normalizedSerialNumber)) {
            throw new IllegalArgumentException("Equipment with serial number already exists: " + normalizedSerialNumber);
        }

        Equipment equipment = new Equipment(
                equipmentDTO.getType(),
                normalizedSerialNumber,
                equipmentDTO.getDescription()
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

    private String normalizeSerialNumber(String serialNumber) {
        if (serialNumber == null || serialNumber.isBlank()) {
            throw new IllegalArgumentException("Serial number must not be blank");
        }

        return serialNumber.trim().toUpperCase();
    }
}