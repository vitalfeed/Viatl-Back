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

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
      // Debug: Log cart items to check imageUrl
      console.log('Cart items:', items);
      items.forEach(item => {
        console.log(`Product: ${item.name}, ImageURL: ${item.imageUrl}`);
      });
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
    console.log('Proceed to checkout');
    // Add checkout logic here
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      this.cartItems.forEach(item => this.cartService.removeFromCart(item.id));
    }
  }

  trackByCartItemId(index: number, item: CartItem): number {
    return item.id;
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.log('Image failed to load:', img.src);
    img.src = '/assets/images/default-product.jpg';
    img.onerror = null; // Prevent infinite loop
  }

  /**
   * Get display label for category
   */
  getCategoryLabel(category: string): string {
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
  getSubCategoryLabel(subCategory: string): string {
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
}
