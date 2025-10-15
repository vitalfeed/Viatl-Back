package com.veterinaire.formulaireveterinaire.DAO;

import com.veterinaire.formulaireveterinaire.entity.CabinetVeterinaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CabinetVeterinaireRepository extends JpaRepository<CabinetVeterinaire, Long> {
    Optional<CabinetVeterinaire> findByNameAndAddress(String name, String address);
}
