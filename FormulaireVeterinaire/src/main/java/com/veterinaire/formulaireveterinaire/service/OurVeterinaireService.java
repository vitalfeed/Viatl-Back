package com.veterinaire.formulaireveterinaire.service;

import org.springframework.web.multipart.MultipartFile;

public interface OurVeterinaireService {
    void uploadExcel(MultipartFile file) throws Exception;
}
