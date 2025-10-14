package com.veterinaire.formulaireveterinaire.entity;

import com.veterinaire.formulaireveterinaire.Enums.SubscriptionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Nom est obligatoire")
    private String nom;

    @Column(nullable = false)
    @NotBlank(message = "Prénom est obligatoire")
    private String prenom;

    @Column(nullable = false, unique = true)
    @Email(message = "Email invalide")
    @NotBlank(message = "Email est obligatoire")
    private String email;

    @Column(nullable = true) // Telephone is optional
    private String telephone;

    @Column(nullable = false)
    @NotBlank(message = "Adresse du cabinet est obligatoire")
    private String adresseCabinet;

    @Column(nullable = false)
    @NotBlank(message = "Numéro matricule est obligatoire")
    private String numMatricule;

    @Column(nullable = false)
    @NotBlank(message = "Mot de passe est obligatoire")
    private String password;

    @Column(nullable = false)
    private boolean isAdmin = false;

    @Column(nullable = false)
    private boolean isFirstLogin = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status = SubscriptionStatus.INACTIVE;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private VeterinaireProfile veterinaireProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Subscription subscription;
}