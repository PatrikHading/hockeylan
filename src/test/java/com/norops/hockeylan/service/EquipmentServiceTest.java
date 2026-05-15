package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.repository.EquipmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    @Test
    void addEquipmentShouldSaveEquipmentWhenSerialNumberIsUnique() {
        EquipmentDTO dto = new EquipmentDTO();
        dto.setType(EquipmentType.HELMET);
        dto.setSerialNumber("helmet-001");
        dto.setDescription("Bauer hjälm");

        when(equipmentRepository.existsBySerialNumberIgnoreCase("HELMET-001"))
                .thenReturn(false);

        when(equipmentRepository.save(any(Equipment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Equipment result = equipmentService.addEquipment(dto);

        assertEquals(EquipmentType.HELMET, result.getType());
        assertEquals("HELMET-001", result.getSerialNumber());
        assertEquals("Bauer hjälm", result.getDescription());
        assertTrue(result.isAvailable());

        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void addEquipmentShouldThrowWhenSerialNumberAlreadyExists() {
        EquipmentDTO dto = new EquipmentDTO();
        dto.setType(EquipmentType.HELMET);
        dto.setSerialNumber("helmet-001");
        dto.setDescription("Bauer hjälm");

        when(equipmentRepository.existsBySerialNumberIgnoreCase("HELMET-001"))
                .thenReturn(true);

        assertThrows(
                DuplicateResourceException.class,
                () -> equipmentService.addEquipment(dto)
        );

        verify(equipmentRepository, never()).save(any());
    }

    @Test
    void getEquipmentByIdShouldReturnEquipmentWhenFound() {
        Equipment equipment = new Equipment(
                EquipmentType.STICK,
                "STICK-001",
                "CCM klubba"
        );

        when(equipmentRepository.findById(1L))
                .thenReturn(Optional.of(equipment));

        Equipment result = equipmentService.getEquipmentById(1L);

        assertEquals("STICK-001", result.getSerialNumber());
    }

    @Test
    void getEquipmentByIdShouldThrowWhenMissing() {
        when(equipmentRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> equipmentService.getEquipmentById(99L)
        );
    }

    @Test
    void getEquipmentBySerialNumberShouldReturnEquipmentWhenFound() {
        Equipment equipment = new Equipment(
                EquipmentType.SKATES,
                "SKATES-001",
                "CCM skridskor"
        );

        when(equipmentRepository.findBySerialNumberIgnoreCase("SKATES-001"))
                .thenReturn(Optional.of(equipment));

        Equipment result = equipmentService.getEquipmentBySerialNumber("skates-001");

        assertEquals("SKATES-001", result.getSerialNumber());
    }

    @Test
    void updateAvailabilityShouldChangeAvailability() {
        Equipment equipment = new Equipment(
                EquipmentType.COMPLETE_KIT,
                "KIT-001",
                "Komplett kit"
        );

        when(equipmentRepository.findById(1L))
                .thenReturn(Optional.of(equipment));

        Equipment result = equipmentService.updateAvailability(1L, false);

        assertFalse(result.isAvailable());
    }
}