import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-produits-veterinaire',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './produits-veterinaire.component.html',
  styleUrls: ['./produits-veterinaire.component.scss']
})
export class ProduitsVeterinaireComponent implements OnInit {
  // All available products
  allProducts: Product[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  // Mock data as fallback (will be replaced by API data)
  private mockProducts: Product[] = [
    {
      id: 1,
      name: 'Croquettes Premium Chien Adulte',
      price: 45.99,
      imageUrl: '/assets/images/croquettes-chien.jpg',
      category: 'CHIEN',
      subCategory: 'ALIMENT',
      description: 'Croquettes haute qualité pour chien adulte',
      inStock: true,
      detailsUrl: '#'
    },
    {
      id: 2,
      name: 'Complément Vitaminé Chat',
      price: 29.99,
      imageUrl: '/assets/images/vitamines-chat.jpg',
      category: 'CHAT',
      subCategory: 'COMPLEMENT',
      description: 'Vitamines essentielles pour chat',
      inStock: true,
      detailsUrl: '#'
    },
    {
      id: 3,
      name: 'Test Rapide FIV/FeLV',
      price: 35.50,
      imageUrl: '/assets/images/test-fiv.jpg',
      category: 'CHAT',
      subCategory: 'TEST_RAPIDE',
      description: 'Test de dépistage rapide',
      inStock: false,
      detailsUrl: '#'
    },
    {
      id: 4,
      name: 'Pâtée Premium Chien Senior',
      price: 38.99,
      imageUrl: '/assets/images/patee-chien.jpg',
      category: 'CHIEN',
      subCategory: 'ALIMENT',
      description: 'Alimentation adaptée aux chiens âgés',
      inStock: true,
      detailsUrl: '#'
    },
    {
      id: 5,
      name: 'Probiotiques Chat Digestif',
      price: 42.00,
      imageUrl: '/assets/images/probiotiques.jpg',
      category: 'CHAT',
      subCategory: 'COMPLEMENT',
      description: 'Soutien de la flore intestinale',
      inStock: true,
      detailsUrl: '#'
    },
    {
      id: 6,
      name: 'Vitamines Chien Actif',
      price: 33.90,
      imageUrl: '/assets/images/vitamines-chien.jpg',
      category: 'CHIEN',
      subCategory: 'COMPLEMENT',
      description: 'Complément vitaminé pour chiens sportifs',
      inStock: true,
      detailsUrl: '#'
    },
    {
      id: 7,
      name: 'Test Rapide Parvo Chien',
      price: 28.50,
      imageUrl: '/assets/images/test-parvo.jpg',
      category: 'CHIEN',
      subCategory: 'TEST_RAPIDE',
      description: 'Test de dépistage du parvovirus',
      inStock: true,
      detailsUrl: '#'
    },
    {
      id: 8,
      name: 'Croquettes Premium Chat Stérilisé',
      price: 42.90,
      imageUrl: '/assets/images/croquettes-chat.jpg',
      category: 'CHAT',
      subCategory: 'ALIMENT',
      description: 'Alimentation spécialisée pour chats stérilisés',
      inStock: true,
      detailsUrl: '#'
    }
  ];

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
  currentPage = 1;
  itemsPerPage = 9;
  Math = Math; // Make Math available in template
  highlightedProductId: number | null = null;

  // Profile dropdown
  showProfileDropdown = false;
  showPasswordModal = false;
  passwordForm: FormGroup;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';
  
  // User info
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
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
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

  ngOnInit() {
    // Check if user is logged in
    this.checkAuthentication();

    // Load user data
    this.loadUserData();

    // Load products from API
    this.loadProducts();

    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = items.reduce((count, item) => count + item.quantity, 0);
      this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    });

    // Subscribe to query params changes
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['animal'] || null;
      this.selectedSousCategory = params['type'] || null;

      // Check for highlighted product
      if (params['highlight']) {
        this.highlightedProductId = +params['highlight'];
        // Remove highlight after animation completes
        setTimeout(() => {
          this.highlightedProductId = null;
        }, 3000);
      }

      // Reset to first page when filters change
      this.currentPage = 1;
    });
  }

  /**
   * Check if user is authenticated
   */
  checkAuthentication(): void {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      // Redirect to login if not authenticated
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load user data to get name
   */
  loadUserData(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/veterinaires/${userId}`).subscribe({
      next: (data) => {
        this.userName = data.nom || '';
        this.userFullName = `${data.prenom || ''} ${data.nom || ''}`.trim();
        console.log('User full name:', this.userFullName);
      },
      error: (error) => {
        console.error('Error loading user data:', error);
      }
    });
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear all tokens and user data
    localStorage.removeItem('user_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');

    // Redirect to home page
    this.router.navigate(['/']);
  }

  /**
   * Load products from API
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.isLoading = false;
        console.log('Products loaded:', products.length);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = error.message;
        this.isLoading = false;
        // Use mock data as fallback
        this.allProducts = this.mockProducts;
      }
    });
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
  }

  selectSousCategory(sub: string) {
    this.selectedSousCategory = sub;
    this.showAllProducts = true;
    this.menuOpen = false;
  }

  getFilteredProducts(): Product[] {
    // If no filters are applied, return all products
    if (!this.selectedCategory && !this.selectedSousCategory) {
      return this.allProducts;
    }

    return this.allProducts.filter(product => {
      // Normalize strings for comparison (lowercase, remove accents, underscores to hyphens)
      const normalizeString = (str: string) => {
        return str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/_/g, '-');
      };

      const productCategory = normalizeString(product.category);
      const productSubCategory = normalizeString(product.subCategory);
      const filterCategory = this.selectedCategory ? normalizeString(this.selectedCategory) : null;
      const filterSubCategory = this.selectedSousCategory ? normalizeString(this.selectedSousCategory) : null;

      // If only product type is selected (no specific animal), match any animal with that type
      if (!filterCategory && filterSubCategory) {
        return productSubCategory === filterSubCategory;
      }

      // If only animal is selected (no specific type), match that animal with any type
      if (filterCategory && !filterSubCategory) {
        return productCategory === filterCategory;
      }

      // If both are selected, match both
      if (filterCategory && filterSubCategory) {
        return productCategory === filterCategory && productSubCategory === filterSubCategory;
      }

      return true;
    });
  }

  /**
   * Get display label for category
   */
  getCategoryLabel(category: string): string {
    return this.productService.getCategoryLabel(category);
  }

  /**
   * Get display label for sub-category
   */
  getSubCategoryLabel(subCategory: string): string {
    return this.productService.getSubCategoryLabel(subCategory);
  }

  /**
   * Get emoji for category
   */
  getCategoryEmoji(category: string): string {
    return this.productService.getCategoryEmoji(category);
  }

  /**
   * Get emoji for sub-category
   */
  getSubCategoryEmoji(subCategory: string): string {
    return this.productService.getSubCategoryEmoji(subCategory);
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    console.log('Produit ajouté au panier:', product.name);
  }

  viewProductDetails(product: Product) {
    // Logique pour voir les détails du produit
    console.log('Voir détails du produit:', product);
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

  getPaginatedProducts(): Product[] {
    const filtered = this.getFilteredProducts();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    const filtered = this.getFilteredProducts();
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      // Scroll to top of products
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-product.jpg';
    img.onerror = null; // Prevent infinite loop
  }

  /**
   * Toggle profile dropdown
   */
  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  /**
   * Close profile dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.showProfileDropdown = false;
    }
  }

  /**
   * Open password change modal
   */
  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.showProfileDropdown = false;
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close password change modal
   */
  closePasswordModal(): void {
    this.showPasswordModal = false;
    document.body.style.overflow = 'auto';
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  /**
   * Change password
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const userToken = localStorage.getItem('user_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    });

    const body = {
      newPassword: this.passwordForm.value.newPassword
    };

    this.http.post(`${environment.apiUrl}/reset-password`, body, { headers, responseType: 'text' }).subscribe({
      next: (response) => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe modifié avec succès !';

        // Close modal after 2 seconds
        setTimeout(() => {
          this.closePasswordModal();
        }, 2000);
      },
      error: (error) => {
        this.passwordLoading = false;
        console.error('Password change error:', error);

        if (error.status === 401) {
          this.passwordError = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          this.passwordError = 'Le mot de passe ne respecte pas les critères requis.';
        } else {
          this.passwordError = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }



  navigateToVetSpace(): void {
    this.router.navigate(['/espace-veterinaire']);
  }

  goToCart(): void {
    // For now, we'll just log this action
    console.log('Navigate to cart');
  }

  checkout(): void {
    // For now, we'll just log this action
    console.log('Proceed to checkout');
  }
}