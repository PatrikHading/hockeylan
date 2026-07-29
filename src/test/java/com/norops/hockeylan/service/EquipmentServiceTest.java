package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.repository.EquipmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    @Test
    void addEquipmentShouldSaveAllFieldsWhenSerialNumberIsUnique() {
        EquipmentDTO dto = completeEquipmentDTO();

        when(
                equipmentRepository
                        .existsBySerialNumberIgnoreCase(
                                "HELMET-001"
                        )
        ).thenReturn(false);

        when(
                equipmentRepository.save(
                        any(Equipment.class)
                )
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(0)
        );

        Equipment result =
                equipmentService.addEquipment(dto);

        assertAll(
                () -> assertEquals(
                        EquipmentType.HELMET,
                        result.getType()
                ),
                () -> assertEquals(
                        "HELMET-001",
                        result.getSerialNumber()
                ),
                () -> assertEquals(
                        "M",
                        result.getSize()
                ),
                () -> assertEquals(
                        "Bauer",
                        result.getBrand()
                ),
                () -> assertEquals(
                        "Re-Akt 150",
                        result.getModel()
                ),
                () -> assertEquals(
                        EquipmentCondition.GOOD,
                        result.getCondition()
                ),
                () -> assertEquals(
                        AgeCategory.JUNIOR,
                        result.getAgeCategory()
                ),
                () -> assertEquals(
                        "Hylla A2",
                        result.getStorageLocation()
                ),
                () -> assertEquals(
                        "Svart hjälm",
                        result.getDescription()
                ),
                () -> assertTrue(
                        result.isAvailable()
                ),
                () -> assertTrue(
                        result.isActive()
                )
        );

        verify(equipmentRepository)
                .save(any(Equipment.class));
    }

    @Test
    void addEquipmentShouldConvertBlankOptionalTextToNull() {
        EquipmentDTO dto =
                completeEquipmentDTO();

        dto.setSize(" ");
        dto.setBrand("");
        dto.setModel("\t");
        dto.setStorageLocation("  ");
        dto.setDescription("\n");

        when(
                equipmentRepository
                        .existsBySerialNumberIgnoreCase(
                                "HELMET-001"
                        )
        ).thenReturn(false);

        when(
                equipmentRepository.save(
                        any(Equipment.class)
                )
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(0)
        );

        Equipment result =
                equipmentService.addEquipment(dto);

        assertAll(
                () -> assertNull(
                        result.getSize()
                ),
                () -> assertNull(
                        result.getBrand()
                ),
                () -> assertNull(
                        result.getModel()
                ),
                () -> assertNull(
                        result.getStorageLocation()
                ),
                () -> assertNull(
                        result.getDescription()
                )
        );
    }

    @Test
    void addEquipmentShouldThrowWhenSerialNumberAlreadyExists() {
        EquipmentDTO dto =
                completeEquipmentDTO();

        when(
                equipmentRepository
                        .existsBySerialNumberIgnoreCase(
                                "HELMET-001"
                        )
        ).thenReturn(true);

        assertThrows(
                DuplicateResourceException.class,
                () ->
                        equipmentService
                                .addEquipment(dto)
        );

        verify(
                equipmentRepository,
                never()
        ).save(any(Equipment.class));
    }

    @Test
    void updateEquipmentShouldUpdateAllEditableFields() {
        Equipment equipment =
                existingEquipment();

        EquipmentDTO dto =
                completeEquipmentDTO();

        dto.setType(EquipmentType.SKATES);
        dto.setSerialNumber(" skates-010 ");
        dto.setSize(" 42 ");
        dto.setBrand(" CCM ");
        dto.setModel(" Jetspeed ");
        dto.setCondition(
                EquipmentCondition.WORN
        );
        dto.setAgeCategory(
                AgeCategory.SENIOR
        );
        dto.setStorageLocation(
                " Hylla B4 "
        );
        dto.setDescription(
                " Använda skridskor "
        );

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                equipmentRepository
                        .existsBySerialNumberIgnoreCaseAndIdNot(
                                "SKATES-010",
                                1L
                        )
        ).thenReturn(false);

        Equipment result =
                equipmentService.updateEquipment(
                        1L,
                        dto
                );

        assertSame(equipment, result);

        assertAll(
                () -> assertEquals(
                        EquipmentType.SKATES,
                        result.getType()
                ),
                () -> assertEquals(
                        "SKATES-010",
                        result.getSerialNumber()
                ),
                () -> assertEquals(
                        "42",
                        result.getSize()
                ),
                () -> assertEquals(
                        "CCM",
                        result.getBrand()
                ),
                () -> assertEquals(
                        "Jetspeed",
                        result.getModel()
                ),
                () -> assertEquals(
                        EquipmentCondition.WORN,
                        result.getCondition()
                ),
                () -> assertEquals(
                        AgeCategory.SENIOR,
                        result.getAgeCategory()
                ),
                () -> assertEquals(
                        "Hylla B4",
                        result.getStorageLocation()
                ),
                () -> assertEquals(
                        "Använda skridskor",
                        result.getDescription()
                ),
                () -> assertTrue(
                        result.isAvailable()
                ),
                () -> assertTrue(
                        result.isActive()
                )
        );

        verify(
                equipmentRepository,
                never()
        ).delete(any(Equipment.class));
    }

    @Test
    void updateEquipmentShouldAllowCurrentSerialNumber() {
        Equipment equipment =
                existingEquipment();

        EquipmentDTO dto =
                completeEquipmentDTO();

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                equipmentRepository
                        .existsBySerialNumberIgnoreCaseAndIdNot(
                                "HELMET-001",
                                1L
                        )
        ).thenReturn(false);

        Equipment result =
                equipmentService.updateEquipment(
                        1L,
                        dto
                );

        assertEquals(
                "HELMET-001",
                result.getSerialNumber()
        );
    }

    @Test
    void updateEquipmentShouldThrowWhenAnotherEquipmentUsesSerialNumber() {
        Equipment equipment =
                existingEquipment();

        EquipmentDTO dto =
                completeEquipmentDTO();

        dto.setSerialNumber("HELMET-002");

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                equipmentRepository
                        .existsBySerialNumberIgnoreCaseAndIdNot(
                                "HELMET-002",
                                1L
                        )
        ).thenReturn(true);

        assertThrows(
                DuplicateResourceException.class,
                () ->
                        equipmentService
                                .updateEquipment(
                                        1L,
                                        dto
                                )
        );

        assertEquals(
                "HELMET-001",
                equipment.getSerialNumber()
        );

        verify(
                equipmentRepository,
                never()
        ).save(any(Equipment.class));

        verify(
                equipmentRepository,
                never()
        ).delete(any(Equipment.class));
    }

    @Test
    void updateActiveStatusShouldDeactivateWithoutDeleting() {
        Equipment equipment =
                existingEquipment();

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        Equipment result =
                equipmentService
                        .updateActiveStatus(
                                1L,
                                false
                        );

        assertFalse(result.isActive());

        verify(
                equipmentRepository,
                never()
        ).delete(any(Equipment.class));
    }

    @Test
    void updateActiveStatusShouldReactivateEquipment() {
        Equipment equipment =
                existingEquipment();

        equipment.setActive(false);

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        Equipment result =
                equipmentService
                        .updateActiveStatus(
                                1L,
                                true
                        );

        assertTrue(result.isActive());

        verify(
                equipmentRepository,
                never()
        ).delete(any(Equipment.class));
    }

    @Test
    void searchEquipmentShouldUseSpecificationAndSorting() {
        Equipment equipment =
                existingEquipment();

        when(
                equipmentRepository.findAll(
                        any(Specification.class),
                        any(Sort.class)
                )
        ).thenReturn(
                List.of(equipment)
        );

        List<Equipment> result =
                equipmentService.searchEquipment(
                        " bauer ",
                        EquipmentType.HELMET,
                        EquipmentCondition.GOOD,
                        AgeCategory.JUNIOR,
                        true,
                        true
                );

        assertEquals(
                List.of(equipment),
                result
        );

        verify(equipmentRepository)
                .findAll(
                        any(Specification.class),
                        any(Sort.class)
                );
    }

    @Test
    void getEquipmentByIdShouldReturnEquipmentWhenFound() {
        Equipment equipment =
                existingEquipment();

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        Equipment result =
                equipmentService
                        .getEquipmentById(1L);

        assertEquals(
                "HELMET-001",
                result.getSerialNumber()
        );
    }

    @Test
    void getEquipmentByIdShouldThrowWhenMissing() {
        when(
                equipmentRepository.findById(99L)
        ).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        equipmentService
                                .getEquipmentById(
                                        99L
                                )
        );
    }

    @Test
    void getEquipmentBySerialNumberShouldReturnEquipmentWhenFound() {
        Equipment equipment =
                existingEquipment();

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCase(
                                "HELMET-001"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        Equipment result =
                equipmentService
                        .getEquipmentBySerialNumber(
                                "helmet-001"
                        );

        assertEquals(
                "HELMET-001",
                result.getSerialNumber()
        );
    }

    @Test
    void updateAvailabilityShouldChangeAvailability() {
        Equipment equipment =
                existingEquipment();

        when(
                equipmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(equipment)
        );

        Equipment result =
                equipmentService
                        .updateAvailability(
                                1L,
                                false
                        );

        assertFalse(result.isAvailable());
    }

    @Test
    void blankSerialNumberShouldBeRejectedBeforeRepositoryLookup() {
        EquipmentDTO dto =
                completeEquipmentDTO();

        dto.setSerialNumber(" ");

        assertThrows(
                IllegalArgumentException.class,
                () ->
                        equipmentService
                                .addEquipment(dto)
        );

        verify(
                equipmentRepository,
                never()
        ).existsBySerialNumberIgnoreCase(
                anyString()
        );

        verify(
                equipmentRepository,
                never()
        ).save(any(Equipment.class));
    }

    private EquipmentDTO
    completeEquipmentDTO() {
        EquipmentDTO dto =
                new EquipmentDTO();

        dto.setType(
                EquipmentType.HELMET
        );
        dto.setSerialNumber(
                " helmet-001 "
        );
        dto.setSize(" M ");
        dto.setBrand(" Bauer ");
        dto.setModel(" Re-Akt 150 ");
        dto.setCondition(
                EquipmentCondition.GOOD
        );
        dto.setAgeCategory(
                AgeCategory.JUNIOR
        );
        dto.setStorageLocation(
                " Hylla A2 "
        );
        dto.setDescription(
                " Svart hjälm "
        );

        return dto;
    }

    private Equipment existingEquipment() {
        Equipment equipment =
                new Equipment(
                        EquipmentType.HELMET,
                        "HELMET-001",
                        "M",
                        "Bauer",
                        "Re-Akt 150",
                        EquipmentCondition.GOOD,
                        AgeCategory.JUNIOR,
                        "Hylla A2",
                        "Svart hjälm"
                );

        equipment.setId(1L);

        return equipment;
    }
}