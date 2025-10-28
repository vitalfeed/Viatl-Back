import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.scss']
})
export class PanierComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal = 0;
  showSuccessModal = false;
  isCheckingOut = false;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    // Reload cart from backend when page loads
    this.cartService.loadCartFromBackend();
    
    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      console.log('Panier component received cart items:', items);
      this.cartItems = items;
      this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity > 0) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  continueShopping(): void {
    this.router.navigate(['/produits-veterinaire']);
  }

  proceedToCheckout(): void {
    if (confirm('Êtes-vous sûr de vouloir passer cette commande ?')) {
      this.isCheckingOut = true;
      
      this.cartService.checkout('').subscribe({
        next: (response) => {
          this.isCheckingOut = false;
          
          if (response.error) {
            alert('Erreur lors de la commande: ' + response.error);
          } else {
            // Show success modal
            this.showSuccessModal = true;
            document.body.style.overflow = 'hidden';
          }
        },
        error: (error) => {
          this.isCheckingOut = false;
          console.error('Checkout error:', error);
          alert('Erreur lors de la commande. Veuillez réessayer.');
        }
      });
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    document.body.style.overflow = 'auto';
    this.router.navigate(['/espace-veterinaire']);
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      this.cartService.clearCart();
    }
  }

  trackByCartItemId(_index: number, item: CartItem): number {
    return item.id;
  }

  /**
   * Get display label for category
   */
  getCategoryLabel(category?: string): string {
    if (!category) return '';
    
    const labels: { [key: string]: string } = {
      'CHIEN': 'Chien',
      'CHAT': 'Chat',
      'Chien': 'Chien',
      'Chat': 'Chat'
    };
    return labels[category] || category;
  }

  /**
   * Get display label for sub-category
   */
  getSubCategoryLabel(subCategory?: string): string {
    if (!subCategory) return '';
    
    const labels: { [key: string]: string } = {
      'ALIMENT': 'Aliment',
      'COMPLEMENT': 'Complément',
      'TEST_RAPIDE': 'Test rapide',
      'Aliment': 'Aliment',
      'Complément': 'Complément',
      'Test rapide': 'Test rapide'
    };
    return labels[subCategory] || subCategory;
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
