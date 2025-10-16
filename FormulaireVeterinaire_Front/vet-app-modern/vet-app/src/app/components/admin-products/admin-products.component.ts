import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  selectedCategory = '';
  selectedSubCategory = '';
  viewMode: 'grid' | 'list' = 'grid'; // Toggle between grid and list view

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedProduct: Product | null = null;

  // Notification state
  notification: { message: string; type: 'success' | 'error' } | null = null;

  // Form data
  productForm = {
    name: '',
    description: '',
    price: 0,
    category: '',
    subCategory: '',
    detailsUrl: '',
    inStock: true
  };

  constructor(
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = '';

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des produits';
        this.loading = false;
        console.error('Error loading products:', err);
      }
    });
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm ||
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.subCategory.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.selectedCategory ||
        product.category === this.selectedCategory;

      const matchesSubCategory = !this.selectedSubCategory ||
        product.subCategory === this.selectedSubCategory;

      return matchesSearch && matchesCategory && matchesSubCategory;
    });
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.filterProducts();
  }

  onCategoryChange(value: string) {
    this.selectedCategory = value;
    this.filterProducts();
  }

  onSubCategoryChange(value: string) {
    this.selectedSubCategory = value;
    this.filterProducts();
  }

  toggleViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedSubCategory = '';
    this.filterProducts();
  }

  getCategoryLabel(category: string): string {
    return this.productService.getCategoryLabel(category);
  }

  getSubCategoryLabel(subCategory: string): string {
    return this.productService.getSubCategoryLabel(subCategory);
  }

  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  openEditModal(product: any) {
    this.selectedProduct = product;
    this.productForm = { ...product };
    this.showEditModal = true;
  }

  openDeleteModal(product: any) {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedProduct = null;
    this.resetForm();
  }

  resetForm() {
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      category: '',
      subCategory: '',
      detailsUrl: '',
      inStock: true
    };
  }

  addProduct() {
    const productData = {
      name: this.productForm.name,
      description: this.productForm.description,
      price: this.productForm.price,
      category: this.productForm.category as 'CHAT' | 'CHIEN',
      subCategory: this.productForm.subCategory as 'ALIMENT' | 'COMPLEMENT' | 'TEST_RAPIDE',
      imageUrl: '', // Always empty as per requirement
      detailsUrl: this.productForm.detailsUrl,
      inStock: this.productForm.inStock
    };

    this.productService.addProduct(productData).subscribe({
      next: (newProduct) => {
        // Add the new product to the local array
        this.products.push(newProduct);
        this.filterProducts();
        this.closeModals();
        this.showSuccessMessage('Produit ajouté avec succès!');
      },
      error: (err) => {
        console.error('Error adding product:', err);
        this.showErrorMessage('Erreur lors de l\'ajout du produit. Veuillez réessayer.');
      }
    });
  }

  updateProduct() {
    if (!this.selectedProduct) return;

    const productData: Partial<Product> = {
      name: this.productForm.name,
      description: this.productForm.description,
      price: this.productForm.price,
      category: this.productForm.category as 'CHAT' | 'CHIEN',
      subCategory: this.productForm.subCategory as 'ALIMENT' | 'COMPLEMENT' | 'TEST_RAPIDE',
      imageUrl: '', // Always empty as per requirement
      detailsUrl: this.productForm.detailsUrl,
      inStock: this.productForm.inStock
    };

    this.productService.updateProduct(this.selectedProduct.id, productData).subscribe({
      next: (updatedProduct) => {
        // Update the product in the local array
        const index = this.products.findIndex(p => p.id === this.selectedProduct!.id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }
        this.filterProducts();
        this.closeModals();
        this.showSuccessMessage('Produit modifié avec succès!');
      },
      error: (err) => {
        console.error('Error updating product:', err);
        this.showErrorMessage('Erreur lors de la modification du produit. Veuillez réessayer.');
      }
    });
  }

  deleteProduct() {
    if (!this.selectedProduct) return;

    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        // Remove the product from the local array
        this.products = this.products.filter(p => p.id !== this.selectedProduct!.id);
        this.filterProducts();
        this.closeModals();
        this.showSuccessMessage('Produit supprimé avec succès!');
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.showErrorMessage('Erreur lors de la suppression du produit. Veuillez réessayer.');
      }
    });
  }

  showSuccessMessage(message: string) {
    this.notification = { message, type: 'success' };
    setTimeout(() => {
      this.notification = null;
    }, 4000); // Auto-hide after 4 seconds
  }

  showErrorMessage(message: string) {
    this.notification = { message, type: 'error' };
    setTimeout(() => {
      this.notification = null;
    }, 5000); // Auto-hide after 5 seconds
  }

  closeNotification() {
    this.notification = null;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
