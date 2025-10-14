package com.veterinaire.formulaireveterinaire.serviceimpl;

import com.veterinaire.formulaireveterinaire.DAO.OurVeterinaireRepository;
import com.veterinaire.formulaireveterinaire.entity.OurVeterinaire;
import com.veterinaire.formulaireveterinaire.service.OurVeterinaireService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

@Service
public class OurVeterinaireServiceImpl implements OurVeterinaireService {
    private static final Logger logger = LoggerFactory.getLogger(OurVeterinaireServiceImpl.class);

    private final OurVeterinaireRepository ourVeterinaireRepository;

    public OurVeterinaireServiceImpl(OurVeterinaireRepository ourVeterinaireRepository) {
        this.ourVeterinaireRepository = ourVeterinaireRepository;
    }

    @Override
    public void uploadExcel(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new Exception("Le fichier Excel est vide ou la feuille n'existe pas.");
            }

            for (Row row : sheet) {
                if (row == null || row.getRowNum() == 0) continue; // Skip header or null rows

                // Get cells with null check
                Cell nomCell = row.getCell(0, Row.MissingCellPolicy.RETURN_NULL_AND_BLANK);
                Cell prenomCell = row.getCell(1, Row.MissingCellPolicy.RETURN_NULL_AND_BLANK);
                Cell matriculeCell = row.getCell(2, Row.MissingCellPolicy.RETURN_NULL_AND_BLANK);

                if (nomCell == null || prenomCell == null || matriculeCell == null) {
                    logger.warn("Row {} has missing cells, skipping.", row.getRowNum());
                    continue;
                }

                // Handle different cell types
                String nom = getCellValueAsString(nomCell).trim();
                String prenom = getCellValueAsString(prenomCell).trim();
                String matricule = getCellValueAsString(matriculeCell).trim();

                if (nom.isEmpty() || prenom.isEmpty() || matricule.isEmpty()) {
                    logger.warn("Row {} has empty values, skipping.", row.getRowNum());
                    continue;
                }

                Optional<OurVeterinaire> existing = ourVeterinaireRepository.findByMatricule(matricule);
                if (existing.isPresent()) {
                    // Update existing
                    OurVeterinaire vet = existing.get();
                    vet.setNom(nom);
                    vet.setPrenom(prenom);
                    ourVeterinaireRepository.save(vet);
                    logger.info("Updated OurVeterinaire for matricule: {} (Row {})", matricule, row.getRowNum());
                } else {
                    // Create new
                    OurVeterinaire vet = new OurVeterinaire();
                    vet.setNom(nom);
                    vet.setPrenom(prenom);
                    vet.setMatricule(matricule);
                    ourVeterinaireRepository.save(vet);
                    logger.info("Created OurVeterinaire for matricule: {} (Row {})", matricule, row.getRowNum());
                }
            }
        } catch (IOException e) {
            logger.error("Error processing Excel file: {}", e.getMessage());
            throw new Exception("Erreur lors du traitement du fichier Excel", e);
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue() != null ? cell.getStringCellValue() : "";
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            case BLANK:
                return "";
            default:
                return "";
        }
    }
}
