package com.veterinaire.formulaireveterinaire.service;

import org.springframework.web.multipart.MultipartFile;

public interface CabinetVeterinaireService {
    void saveFromExcel(MultipartFile file) throws Exception;
}
