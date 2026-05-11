package com.norops.hockeylan.repository;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Optional<Equipment> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    List<Equipment> findByAvailable(boolean available);
    List<Equipment> findByType(EquipmentType type);
}
