package com.norops.hockeylan.config;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "app.seed.enabled",
        havingValue = "true"
)
public class DataSeeder implements CommandLineRunner {

    private final EquipmentRepository equipmentRepository;

    @Override
    public void run(String... args) {
        seedEquipment(EquipmentType.HELMET, "HL-DEV-001", "Demo hjälm för utveckling");
        seedEquipment(EquipmentType.SKATES, "SK-DEV-001", "Demo skridskor för utveckling");
        seedEquipment(EquipmentType.STICK, "ST-DEV-001", "Demo klubba för utveckling");
        seedEquipment(EquipmentType.COMPLETE_KIT, "KIT-DEV-001", "Komplett demo-kit för utveckling");
    }

    private void seedEquipment(
            EquipmentType type,
            String serialNumber,
            String description
    ) {
        if (equipmentRepository.existsBySerialNumberIgnoreCase(serialNumber)) {
            return;
        }

        Equipment equipment = new Equipment(type, serialNumber, description);
        equipmentRepository.save(equipment);
    }
}