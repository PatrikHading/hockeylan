package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private static final Logger log = LoggerFactory.getLogger(EquipmentService.class);

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
        return equipmentRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with serial number: " + serialNumber));
    }

    @Transactional
    public Equipment addEquipment(EquipmentDTO equipmentDTO) {
        String serialNumber = equipmentDTO.getSerialNumber().trim();

        if (equipmentRepository.existsBySerialNumber(serialNumber)) {
            throw new DuplicateResourceException("Equipment already exists with serial number: " + serialNumber);
        }

        Equipment equipment = new Equipment(
                equipmentDTO.getType(),
                serialNumber,
                normalizeBlankToNull(equipmentDTO.getDescription())
        );

        Equipment savedEquipment = equipmentRepository.save(equipment);
        log.info("Created equipment with id {} and serial number {}", savedEquipment.getId(), savedEquipment.getSerialNumber());

        return savedEquipment;
    }

    @Transactional
    public Equipment markAsLoaned(Long id) {
        Equipment equipment = getEquipmentById(id);

        if (!equipment.isAvailable()) {
            throw new BusinessRuleException("Equipment is already loaned");
        }

        equipment.setAvailable(false);
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment markAsReturned(Long id) {
        Equipment equipment = getEquipmentById(id);

        if (equipment.isAvailable()) {
            throw new BusinessRuleException("Equipment is already returned");
        }

        equipment.setAvailable(true);
        return equipmentRepository.save(equipment);
    }

    private String normalizeBlankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}