package com.veterinaire.formulaireveterinaire.controller;


import com.veterinaire.formulaireveterinaire.Enums.SubscriptionType;
import com.veterinaire.formulaireveterinaire.DTO.SubscriptionDTO;
import com.veterinaire.formulaireveterinaire.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/assign/{userId}")
    public ResponseEntity<String> assignSubscription(@PathVariable Long userId, @RequestParam SubscriptionType subscriptionType) {
        return ResponseEntity.ok(subscriptionService.assignSubscription(userId, subscriptionType));
    }


    @PutMapping("/update/{subscriptionId}")
    public ResponseEntity<String> updateSubscription(@PathVariable Long subscriptionId, @RequestParam SubscriptionType subscriptionType) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(subscriptionId, subscriptionType));
    }

    @DeleteMapping("/delete/{subscriptionId}")
    public ResponseEntity<String> deleteSubscription(@PathVariable Long subscriptionId) {
        return ResponseEntity.ok(subscriptionService.deleteSubscription(subscriptionId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<SubscriptionDTO>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/{subscriptionId}")
    public ResponseEntity<SubscriptionDTO> getSubscriptionById(@PathVariable Long subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
