import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { ProductSkeletonComponent } from '../product-skeleton/product-skeleton.component';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';

@Component({
  selector: 'app-produits-veterinaire',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    ReactiveFormsModule,
    InfiniteScrollDirective,
    ProductSkeletonComponent,
    LazyLoadImageDirective
  ],
  templateUrl: './produits-veterinaire.component.html',
  styleUrls: ['./produits-veterinaire.component.scss']
})
export class ProduitsVeterinaireComponent implements OnInit {
  allProducts: Product[] = [];
  displayedProducts: Product[] = []; // Products currently shown
  isLoading: boolean = true;
  isLoadingMore: boolean = false; // Loading more products
  errorMessage: string = '';

  categories = [
    { name: 'Chien', icon: '🐶', color: '#3B82F6' },
    { name: 'Chat', icon: '🐱', color: '#EF4444' }
  ];

  sousCategories = [
    { name: 'Aliment', icon: '🍖', description: 'Nourriture et friandises' },
    { name: 'Complément', icon: '💊', description: 'Suppléments nutritionnels' },
    { name: 'Test rapide', icon: '🧪', description: 'Tests de diagnostic' }
  ];

  selectedCategory: string | null = null;
  selectedSousCategory: string | null = null;
  menuOpen = false;
  cartOpen = false;
  showAllProducts = false;
  cartItems: CartItem[] = [];
  cartCount = 0;
  cartTotal = 0;

  // Infinite scroll properties
  currentPage = 1;
  itemsPerPage = 12; // Load 12 items at a time
  hasMoreProducts = true;

  Math = Math;
  highlightedProductId: number | null = null;

  showProfileDropdown = false;
  showPasswordModal = false;
  passwordForm: FormGroup;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthColor = '';
  userName: string = '';
  userFullName: string = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  passwordStrengthValidator(control: any) {
    const password = control.value;
    if (!password) return null;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    const errors: any = {};
    if (!hasUpperCase) errors.noUpperCase = true;
    if (!hasSpecialChar) errors.noSpecialChar = true;
    if (!hasMinLength) errors.minLength = true;
    return Object.keys(errors).length > 0 ? errors : null;
  }

  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthColor = '';
      return;
    }
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    if (checks.length) strength += 20;
    if (checks.uppercase) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.number) strength += 20;
    if (checks.special) strength += 20;
    this.passwordStrength = strength;
    if (strength <= 40) {
      this.passwordStrengthText = 'Faible';
      this.passwordStrengthColor = '#ef4444';
    } else if (strength <= 60) {
      this.passwordStrengthText = 'Moyen';
      this.passwordStrengthColor = '#f59e0b';
    } else if (strength <= 80) {
      this.passwordStrengthText = 'Bon';
      this.passwordStrengthColor = '#3b82f6';
    } else {
      this.passwordStrengthText = 'Excellent';
      this.passwordStrengthColor = '#10b981';
    }
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit() {
    this.checkAuthentication();
    this.loadUserData();
    this.loadProducts();
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = items.reduce((count, item) => count + item.quantity, 0);
      this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    });
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['animal'] || null;
      this.selectedSousCategory = params['type'] || null;
      if (params['highlight']) {
        this.highlightedProductId = +params['highlight'];
        setTimeout(() => {
          this.highlightedProductId = null;
        }, 3000);
      }
      this.currentPage = 1;
    });
  }

  checkAuthentication(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
    }
  }

  loadUserData(): void {
    this.http.get<any>(`${environment.apiUrl}/veterinaires/me`, { withCredentials: true }).subscribe({
      next: (data) => {
        this.userName = data.nom || '';
        this.userFullName = `${data.prenom || ''} ${data.nom || ''}`.trim();
        if (this.userFullName) {
          localStorage.setItem('userFullName', this.userFullName);
        }
        if (data.id || data.userId) {
          const id = data.id || data.userId;
          localStorage.setItem('userId', id.toString());
        }
      },
      error: (error) => {
        console.error('Error loading user data:', error);
      }
    });
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }

  navigateToPanier(): void {
    this.router.navigate(['/panier']);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.isLoading = false;
        // Load first batch of products
        this.loadMoreProducts();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Load more products for infinite scroll
   */
  loadMoreProducts(): void {
    if (this.isLoadingMore || !this.hasMoreProducts) {
      return;
    }

    this.isLoadingMore = true;

    // Simulate async loading with setTimeout for smooth UX
    setTimeout(() => {
      const filtered = this.getFilteredProducts();
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const newProducts = filtered.slice(startIndex, endIndex);

      if (newProducts.length > 0) {
        this.displayedProducts = [...this.displayedProducts, ...newProducts];
        this.currentPage++;
      }

      // Check if there are more products to load
      this.hasMoreProducts = endIndex < filtered.length;
      this.isLoadingMore = false;
    }, 300); // Small delay for smooth loading animation
  }

  /**
   * Reset displayed products when filters change
   */
  resetDisplayedProducts(): void {
    this.displayedProducts = [];
    this.currentPage = 1;
    this.hasMoreProducts = true;
    this.loadMoreProducts();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleCart() {
    this.cartOpen = !this.cartOpen;
  }

  toggleShowAllProducts() {
    this.showAllProducts = !this.showAllProducts;
    this.menuOpen = false;
  }

  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? null : cat;
    this.selectedSousCategory = null;
    this.resetDisplayedProducts(); // Reset when category changes
  }

  selectSousCategory(sub: string) {
    this.selectedSousCategory = sub;
    this.showAllProducts = true;
    this.menuOpen = false;
    this.resetDisplayedProducts(); // Reset when subcategory changes
  }

  getFilteredProducts(): Product[] {
    if (!this.selectedCategory && !this.selectedSousCategory) {
      return this.allProducts;
    }
    return this.allProducts.filter(product => {
      const normalizeString = (str: string) => {
        return str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[\s_-]/g, '');
      };
      const productCategory = normalizeString(product.category);
      const productSubCategory = normalizeString(product.subCategory);
      const filterCategory = this.selectedCategory ? normalizeString(this.selectedCategory) : null;
      const filterSubCategory = this.selectedSousCategory ? normalizeString(this.selectedSousCategory) : null;
      if (!filterCategory && filterSubCategory) {
        return productSubCategory === filterSubCategory;
      }
      if (filterCategory && !filterSubCategory) {
        return productCategory === filterCategory;
      }
      if (filterCategory && filterSubCategory) {
        return productCategory === filterCategory && productSubCategory === filterSubCategory;
      }
      return true;
    });
  }

  getCategoryLabel(category: string): string {
    return this.productService.getCategoryLabel(category);
  }

  getSubCategoryLabel(subCategory: string): string {
    return this.productService.getSubCategoryLabel(subCategory);
  }

  getCategoryEmoji(category: string): string {
    return this.productService.getCategoryEmoji(category);
  }

  getSubCategoryEmoji(subCategory: string): string {
    return this.productService.getSubCategoryEmoji(subCategory);
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }

  viewProductDetails(product: Product) {
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByCartItemId(index: number, item: CartItem): number {
    return item.id;
  }

  /**
   * Get total count of filtered products
   */
  getTotalProductsCount(): number {
    return this.getFilteredProducts().length;
  }

  /**
   * Get count of currently displayed products
   */
  getDisplayedProductsCount(): number {
    return this.displayedProducts.length;
  }

  /**
   * Handle infinite scroll event
   */
  onScroll(): void {
    if (!this.isLoading && !this.isLoadingMore && this.hasMoreProducts) {
      this.loadMoreProducts();
    }
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.showProfileDropdown = false;
    }
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.showProfileDropdown = false;
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
    document.body.style.overflow = 'hidden';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    document.body.style.overflow = 'auto';
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    const body = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };
    this.http.post(`${environment.apiUrl}/reset-password`, body, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: (response) => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe modifié avec succès !';
        setTimeout(() => {
          this.closePasswordModal();
        }, 2000);
      },
      error: (error) => {
        this.passwordLoading = false;
        console.error('Password change error:', error);
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          let apiError = '';
          if (error.error && typeof error.error === 'string') {
            apiError = error.error;
          } else if (error.error?.message) {
            apiError = error.error.message;
          }
          if (apiError.toLowerCase().includes('current password is incorrect') ||
            apiError.toLowerCase().includes('mot de passe actuel incorrect')) {
            errorMessage = 'Le mot de passe actuel est incorrect.';
          } else if (apiError) {
            errorMessage = apiError;
          } else {
            errorMessage = 'Le mot de passe ne respecte pas les critères requis.';
          }
        }
        this.passwordError = errorMessage;
      }
    });
  }

  navigateToVetSpace(): void {
    this.router.navigate(['/espace-veterinaire']);
  }

  goToCart(): void {
  }

  checkout(): void {
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by removing error handler first
    img.onerror = null;

    // Only set placeholder if not already a data URL
    if (!img.src.includes('data:image')) {
      // SVG with "Image non disponible" text
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EImage non disponible%3C/text%3E%3C/svg%3E';
    }
  }
}
