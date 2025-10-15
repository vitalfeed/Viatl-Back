package com.veterinaire.formulaireveterinaire.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "cabinet_veterinaires")
@Data
@NoArgsConstructor
public class CabinetVeterinaire {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = true)
    private String latitude;

    @Column(nullable = true)
    private String longitude;

    @Column(nullable = true)
    private String phone;

    @Column(nullable = false)
    private boolean isFeatured = false;

    @Column(nullable = false)
    private String type = "BOUTIQUE";
}
