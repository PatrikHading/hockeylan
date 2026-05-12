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
        return equipmentRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with serial number: " + serialNumber));
    }

    @Transactional
    public Equipment addEquipment(EquipmentDTO equipmentDTO) {
        if (equipmentRepository.existsBySerialNumber(equipmentDTO.getSerialNumber())) {
            throw new IllegalStateException("Equipment already exists with serial number: " + equipmentDTO.getSerialNumber());
        }

        Equipment equipment = new Equipment(
                equipmentDTO.getType(),
                equipmentDTO.getSerialNumber(),
                equipmentDTO.getDescription()
        );

        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment markAsLoaned(Long id) {
        Equipment equipment = getEquipmentById(id);

        if (!equipment.isAvailable()) {
            throw new IllegalStateException("Equipment is already loaned");
        }

        equipment.setAvailable(false);
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment markAsReturned(Long id) {
        Equipment equipment = getEquipmentById(id);

        if (equipment.isAvailable()) {
            throw new IllegalStateException("Equipment is already returned");
        }

        equipment.setAvailable(true);
        return equipmentRepository.save(equipment);
    }
}






















