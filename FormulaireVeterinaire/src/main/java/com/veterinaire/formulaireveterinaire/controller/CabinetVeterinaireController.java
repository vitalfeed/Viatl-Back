package com.veterinaire.formulaireveterinaire.controller;

import com.veterinaire.formulaireveterinaire.service.CabinetVeterinaireService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cabinet")
public class CabinetVeterinaireController {

    private static final Logger logger = LoggerFactory.getLogger(CabinetVeterinaireController.class);

    private final CabinetVeterinaireService cabinetVeterinaireService;

    public CabinetVeterinaireController(CabinetVeterinaireService cabinetVeterinaireService) {
        this.cabinetVeterinaireService = cabinetVeterinaireService;
    }

    @PostMapping("/upload-excel")
    public ResponseEntity<Map<String, Object>> uploadExcel(@RequestParam("file") MultipartFile file) {
        logger.info("Received request to upload Excel file");
        try {
            if (file.isEmpty()) {
                logger.warn("Upload failed: No file provided");
                return ResponseEntity.badRequest().body(Map.of("error", "Please upload a file"));
            }

            cabinetVeterinaireService.saveFromExcel(file);
            logger.info("Excel file processed successfully");
            return ResponseEntity.ok(Map.of("message", "Excel file processed successfully"));
        } catch (Exception e) {
            logger.error("Error processing Excel file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Erreur : " + e.getMessage()));
        }
    }
}