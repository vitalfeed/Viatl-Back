package com.veterinaire.formulaireveterinaire.service;

import com.veterinaire.formulaireveterinaire.entity.Product;

import java.util.*;

public interface ProductService {
    List<Product> getAllProducts();
    Optional<Product> getProductById(Long id);
    Product createProduct(Product product);
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id);
    List<Product> getProductsByCategory(String category);
    List<Product> getProductsBySubCategory(String subCategory);
    List<Product> getProductsByStockStatus(Boolean inStock);
}
