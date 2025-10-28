import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-espace-proprietaire',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './espace-proprietaire.component.html',
  styleUrls: ['./espace-proprietaire.component.scss']
})
export class EspaceProprietaireComponent implements OnInit {
  isLoading: boolean = true;
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

  products: Product[] = [];

  selectedCategory: string | null = null;
  selectedSousCategory: string | null = null;
  menuOpen = false;
  currentPage = 1;
  itemsPerPage = 20;
  Math = Math; // Make Math available in template
  highlightedProductId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private productService: ProductService
  ) { }

  ngOnInit() {
    // Load products from API
    this.loadProducts();

    // Listen to query parameters from the navigation menu
    this.route.queryParams.subscribe(params => {
      if (params['animal']) {
        this.selectedCategory = this.capitalizeFirst(params['animal']);
      } else {
        this.selectedCategory = null;
      }

      if (params['type']) {
        this.selectedSousCategory = this.mapProductType(params['type']);
      } else {
        this.selectedSousCategory = null;
      }

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

    // Setup navbar scroll behavior to stop at footer
    this.setupNavbarScrollBehavior();
  }

  /**
   * Setup navbar to stop scrolling when footer appears
   */
  private setupNavbarScrollBehavior(): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      this.handleNavbarScroll();
    }, 100);
  }

  /**
   * Handle scroll event to stop navbar at footer
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.handleNavbarScroll();
  }

  /**
   * Calculate and apply navbar position based on footer visibility
   */
  private handleNavbarScroll(): void {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    
    if (!header || !footer) return;

    const footerRect = footer.getBoundingClientRect();
    const headerHeight = header.offsetHeight;
    const windowHeight = window.innerHeight;

    // Check if footer is entering the viewport
    if (footerRect.top <= windowHeight) {
      // Footer is visible, calculate how much to push navbar up
      const overlap = windowHeight - footerRect.top;
      const maxPush = footerRect.height;
      const pushAmount = Math.min(overlap, maxPush);
      
      // Apply transform to push navbar up
      if (pushAmount > 0) {
        header.style.transform = `translateY(-${pushAmount}px)`;
        header.style.transition = 'transform 0.1s ease-out';
      }
    } else {
      // Footer not visible, reset navbar position
      header.style.transform = 'translateY(0)';
    }
  }

  /**
   * Load products from API
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private mapProductType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'aliment': 'Aliment',
      'complement': 'Complément',
      'test-rapide': 'Test rapide'
    };
    return typeMap[type] || type;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  navigateTo(route: string) {
    this.menuOpen = false;
    if (route === 'ou-trouver-nos-produits') {
      this.router.navigate(['/ou-trouver-nos-produits']);
    } else {
      this.router.navigate(['/espace-proprietaire', route]);
    }
  }

  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? null : cat;
    this.selectedSousCategory = null;
  }

  selectSousCategory(sub: string) {
    this.selectedSousCategory = sub;
    this.menuOpen = false;
  }

  getFilteredProducts(): Product[] {
    // If no filters are applied, return all products
    if (!this.selectedCategory && !this.selectedSousCategory) {
      return this.products;
    }

    return this.products.filter(product => {
      // Normalize strings for comparison (lowercase, remove accents, replace spaces/underscores)
      const normalizeString = (str: string) => {
        return str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[\s_-]/g, ''); // Remove spaces, underscores, and hyphens
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

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    // Optional: Show a toast notification here
  }

  viewProductDetails(product: Product) {
    // Logique pour voir les détails du produit
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByCategoryName(index: number, category: any): string {
    return category.name;
  }

  trackBySubCategoryName(index: number, subCategory: any): string {
    return subCategory.name;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  navigateToVetSpace(): void {
    this.router.navigate(['/']);
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if we already tried to set a fallback
    if (!img.src.includes('data:image')) {
      // Use a simple SVG placeholder instead of trying to load another image
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
    }
  }
}
