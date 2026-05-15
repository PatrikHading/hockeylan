package com.norops.hockeylan.repository;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Optional<Equipment> findBySerialNumberIgnoreCase(String serialNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select e
            from Equipment e
            where lower(e.serialNumber) = lower(:serialNumber)
            """)
    Optional<Equipment> findBySerialNumberIgnoreCaseForUpdate(
            @Param("serialNumber") String serialNumber
    );

    boolean existsBySerialNumberIgnoreCase(String serialNumber);

    List<Equipment> findByAvailable(boolean available);

    List<Equipment> findByType(EquipmentType type);

    List<Equipment> findByAvailableAndType(boolean available, EquipmentType type);
}