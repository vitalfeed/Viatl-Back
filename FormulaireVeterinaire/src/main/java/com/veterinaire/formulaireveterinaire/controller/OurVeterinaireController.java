package com.veterinaire.formulaireveterinaire.controller;

import com.veterinaire.formulaireveterinaire.service.OurVeterinaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/veterinaires")
public class OurVeterinaireController {
    private final OurVeterinaireService ourVeterinaireService;

    public OurVeterinaireController(OurVeterinaireService ourVeterinaireService) {
        this.ourVeterinaireService = ourVeterinaireService;
    }

    @PostMapping("/upload-excel")
    public ResponseEntity<String> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            ourVeterinaireService.uploadExcel(file);
            return ResponseEntity.ok("Fichier Excel traité avec succès.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }
}
