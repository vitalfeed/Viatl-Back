package com.veterinaire.formulaireveterinaire.controller;

import com.veterinaire.formulaireveterinaire.Enums.SubscriptionType;
import com.veterinaire.formulaireveterinaire.service.UserService;
import com.veterinaire.formulaireveterinaire.service.VeterinaireService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/veterinaires")
public class VeterinaireController {

    private final VeterinaireService veterinaireService;

    public VeterinaireController(VeterinaireService veterinaireService) {
        this.veterinaireService = veterinaireService;
    }

    /**
     * Updates the veterinary profile for a specific user with an optional image and subscription type.
     * @param userId The ID of the user whose profile is being updated.
     * @param image The image file to upload (optional).
     * @param subscriptionType The initial subscription type (optional).
     * @return Response with success message.
     */

    @PostMapping(value = "/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateVeterinaireProfile(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "subscriptionType", required = false) SubscriptionType subscriptionType) {

        String result = veterinaireService.updateVeterinaireProfile(userId, image, subscriptionType);
        return ResponseEntity.ok(result);
    }
}