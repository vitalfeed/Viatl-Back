package com.veterinaire.formulaireveterinaire.service;
import com.veterinaire.formulaireveterinaire.Enums.SubscriptionType;
import org.springframework.web.multipart.MultipartFile;

public interface VeterinaireService {
    String updateVeterinaireProfile(Long userId, MultipartFile image, SubscriptionType subscriptionType);
}
