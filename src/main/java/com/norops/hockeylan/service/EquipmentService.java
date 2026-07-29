package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.EquipmentDTO;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.util.InputSanitizer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipmentService {

    private static final Sort EQUIPMENT_SORT =
            Sort.by(
                    Sort.Order.asc("type"),
                    Sort.Order.asc("serialNumber"),
                    Sort.Order.asc("id")
            );

    private final EquipmentRepository
            equipmentRepository;

    @Transactional(readOnly = true)
    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll(
                EQUIPMENT_SORT
        );
    }

    @Transactional(readOnly = true)
    public List<Equipment> searchEquipment(
            String query,
            EquipmentType type,
            EquipmentCondition condition,
            AgeCategory ageCategory,
            Boolean active,
            Boolean available
    ) {
        String normalizedQuery =
                normalizeSearchQuery(query);

        Specification<Equipment> specification =
                buildSpecification(
                        normalizedQuery,
                        type,
                        condition,
                        ageCategory,
                        active,
                        available
                );

        return equipmentRepository.findAll(
                specification,
                EQUIPMENT_SORT
        );
    }

    @Transactional(readOnly = true)
    public Equipment getEquipmentById(
            Long id
    ) {
        return equipmentRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Equipment not found with id: "
                                                + id
                                )
                );
    }

    @Transactional(readOnly = true)
    public Equipment getEquipmentBySerialNumber(
            String serialNumber
    ) {
        String sanitizedSerialNumber =
                sanitizeSerialNumber(
                        serialNumber
                );

        return equipmentRepository
                .findBySerialNumberIgnoreCase(
                        sanitizedSerialNumber
                )
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Equipment not found with serial number: "
                                                + sanitizedSerialNumber
                                )
                );
    }

    public Equipment addEquipment(
            EquipmentDTO equipmentDTO
    ) {
        String sanitizedSerialNumber =
                sanitizeSerialNumber(
                        equipmentDTO
                                .getSerialNumber()
                );

        if (
                equipmentRepository
                        .existsBySerialNumberIgnoreCase(
                                sanitizedSerialNumber
                        )
        ) {
            throw new DuplicateResourceException(
                    "Equipment with serial number already exists: "
                            + sanitizedSerialNumber
            );
        }

        Equipment equipment =
                new Equipment(
                        equipmentDTO.getType(),
                        sanitizedSerialNumber,
                        sanitizeOptionalText(
                                equipmentDTO.getSize()
                        ),
                        sanitizeOptionalText(
                                equipmentDTO.getBrand()
                        ),
                        sanitizeOptionalText(
                                equipmentDTO.getModel()
                        ),
                        equipmentDTO.getCondition(),
                        equipmentDTO
                                .getAgeCategory(),
                        sanitizeOptionalText(
                                equipmentDTO
                                        .getStorageLocation()
                        ),
                        sanitizeOptionalText(
                                equipmentDTO
                                        .getDescription()
                        )
                );

        return equipmentRepository.save(
                equipment
        );
    }

    public Equipment updateEquipment(
            Long id,
            EquipmentDTO equipmentDTO
    ) {
        Equipment equipment =
                getEquipmentById(id);

        String sanitizedSerialNumber =
                sanitizeSerialNumber(
                        equipmentDTO
                                .getSerialNumber()
                );

        boolean serialNumberExists =
                equipmentRepository
                        .existsBySerialNumberIgnoreCaseAndIdNot(
                                sanitizedSerialNumber,
                                id
                        );

        if (serialNumberExists) {
            throw new DuplicateResourceException(
                    "Equipment with serial number already exists: "
                            + sanitizedSerialNumber
            );
        }

        equipment.setType(
                equipmentDTO.getType()
        );

        equipment.setSerialNumber(
                sanitizedSerialNumber
        );

        equipment.setSize(
                sanitizeOptionalText(
                        equipmentDTO.getSize()
                )
        );

        equipment.setBrand(
                sanitizeOptionalText(
                        equipmentDTO.getBrand()
                )
        );

        equipment.setModel(
                sanitizeOptionalText(
                        equipmentDTO.getModel()
                )
        );

        equipment.setCondition(
                equipmentDTO.getCondition()
        );

        equipment.setAgeCategory(
                equipmentDTO.getAgeCategory()
        );

        equipment.setStorageLocation(
                sanitizeOptionalText(
                        equipmentDTO
                                .getStorageLocation()
                )
        );

        equipment.setDescription(
                sanitizeOptionalText(
                        equipmentDTO
                                .getDescription()
                )
        );

        return equipment;
    }

    public Equipment updateActiveStatus(
            Long id,
            boolean active
    ) {
        Equipment equipment =
                getEquipmentById(id);

        equipment.setActive(active);

        return equipment;
    }

    public Equipment updateAvailability(
            Long id,
            boolean available
    ) {
        Equipment equipment =
                getEquipmentById(id);

        equipment.setAvailable(available);

        return equipment;
    }

    private Specification<Equipment>
    buildSpecification(
            String query,
            EquipmentType type,
            EquipmentCondition condition,
            AgeCategory ageCategory,
            Boolean active,
            Boolean available
    ) {
        return (
                root,
                criteriaQuery,
                criteriaBuilder
        ) -> {
            List<Predicate> predicates =
                    new ArrayList<>();

            if (query != null) {
                String searchPattern =
                        "%"
                                + escapeLikePattern(
                                query
                        )
                                + "%";

                Predicate serialNumberMatch =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get(
                                                "serialNumber"
                                        )
                                ),
                                searchPattern,
                                '\\'
                        );

                Predicate sizeMatch =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("size")
                                ),
                                searchPattern,
                                '\\'
                        );

                Predicate brandMatch =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("brand")
                                ),
                                searchPattern,
                                '\\'
                        );

                Predicate modelMatch =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("model")
                                ),
                                searchPattern,
                                '\\'
                        );

                Predicate storageLocationMatch =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get(
                                                "storageLocation"
                                        )
                                ),
                                searchPattern,
                                '\\'
                        );

                Predicate descriptionMatch =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get(
                                                "description"
                                        )
                                ),
                                searchPattern,
                                '\\'
                        );

                predicates.add(
                        criteriaBuilder.or(
                                serialNumberMatch,
                                sizeMatch,
                                brandMatch,
                                modelMatch,
                                storageLocationMatch,
                                descriptionMatch
                        )
                );
            }

            if (type != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("type"),
                                type
                        )
                );
            }

            if (condition != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get(
                                        "condition"
                                ),
                                condition
                        )
                );
            }

            if (ageCategory != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get(
                                        "ageCategory"
                                ),
                                ageCategory
                        )
                );
            }

            if (active != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("active"),
                                active
                        )
                );
            }

            if (available != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get(
                                        "available"
                                ),
                                available
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(
                            Predicate[]::new
                    )
            );
        };
    }

    private String sanitizeSerialNumber(
            String serialNumber
    ) {
        String sanitizedSerialNumber =
                InputSanitizer
                        .cleanSerialNumber(
                                serialNumber
                        );

        if (
                sanitizedSerialNumber == null
                        || sanitizedSerialNumber
                        .isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Serial number must not be blank"
            );
        }

        return sanitizedSerialNumber;
    }

    private String sanitizeOptionalText(
            String value
    ) {
        String sanitizedValue =
                InputSanitizer.cleanText(value);

        if (
                sanitizedValue == null
                        || sanitizedValue.isBlank()
        ) {
            return null;
        }

        return sanitizedValue;
    }

    private String normalizeSearchQuery(
            String query
    ) {
        String sanitizedQuery =
                sanitizeOptionalText(query);

        if (sanitizedQuery == null) {
            return null;
        }

        return sanitizedQuery.toLowerCase(
                Locale.ROOT
        );
    }

    private String escapeLikePattern(
            String value
    ) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}