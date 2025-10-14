package com.veterinaire.formulaireveterinaire.entity;


import com.veterinaire.formulaireveterinaire.Enums.Category;
import com.veterinaire.formulaireveterinaire.Enums.SubCategory;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubCategory subCategory;

    @Column(nullable = false)
    private Boolean inStock;

    @Column
    private String detailsUrl;
}
