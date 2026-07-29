package com.norops.hockeylan.repository;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository
        extends JpaRepository<Equipment, Long>,
        JpaSpecificationExecutor<Equipment> {

    Optional<Equipment>
    findBySerialNumberIgnoreCase(
            String serialNumber
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select equipment
            from Equipment equipment
            where lower(equipment.serialNumber) =
                  lower(:serialNumber)
            """)
    Optional<Equipment>
    findBySerialNumberIgnoreCaseForUpdate(
            @Param("serialNumber")
            String serialNumber
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select equipment
            from Equipment equipment
            where equipment.id = :equipmentId
            """)
    Optional<Equipment> findByIdForUpdate(
            @Param("equipmentId")
            Long equipmentId
    );

    boolean existsBySerialNumberIgnoreCase(
            String serialNumber
    );

    boolean existsBySerialNumberIgnoreCaseAndIdNot(
            String serialNumber,
            Long id
    );

    List<Equipment> findByAvailable(
            boolean available
    );

    List<Equipment> findByType(
            EquipmentType type
    );

    List<Equipment> findByAvailableAndType(
            boolean available,
            EquipmentType type
    );
}