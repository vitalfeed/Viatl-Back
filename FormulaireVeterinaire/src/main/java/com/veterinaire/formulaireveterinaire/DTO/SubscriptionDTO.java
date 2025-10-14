package com.veterinaire.formulaireveterinaire.DTO;

import lombok.Data;

@Data
public class SubscriptionDTO {
    private Long id;
    private UserDTO user;
    private String subscriptionType;
    private String startDate;
    private String endDate;
}
