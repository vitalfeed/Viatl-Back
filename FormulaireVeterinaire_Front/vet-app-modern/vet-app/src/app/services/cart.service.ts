import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number; // Cart item ID (used for removal)
  itemId?: number; // Alternative field name for cart item ID
  productId?: number; // Product ID
  name: string;
  productName?: string; // Backend uses this field
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string;
  subCategory?: string;
}

export interface CartResponse {
  cartId?: number;
  userId?: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  private cartCount = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCount.asObservable();

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {
    // Load cart from backend on service initialization
    this.loadCartFromBackend();
  }

  /**
   * Get current user ID from localStorage
   */
  private getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Load cart from backend
   */
  loadCartFromBackend(): void {
    const userId = this.getUserId();
    if (!userId) {
      // User not logged in, use empty cart
      this.updateLocalCart([]);
      return;
    }

    console.log('Loading cart from backend for userId:', userId);

    this.http.get<CartResponse>(
      `${environment.apiUrl}/cart?userId=${userId}`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Error loading cart:', error);
        // Fallback to localStorage if backend fails
        this.loadCartFromStorage();
        return of({ items: [], totalItems: 0, totalPrice: 0 });
      })
    ).subscribe(response => {
      console.log('Load cart response:', response);
      console.log('Cart items from backend:', response.items);

      // Normalize items - map backend fields to frontend fields
      const normalizedItems = (response.items || []).map(item => ({
        id: item.itemId || item.id || 0,
        itemId: item.itemId,
        productId: item.productId,
        name: item.productName || item.name || 'Produit',
        productName: item.productName,
        price: item.price || 0,
        quantity: item.quantity || 0,
        imageUrl: item.imageUrl || '/assets/images/default-product.jpg',
        category: item.category || '',
        subCategory: item.subCategory || ''
      }));

      console.log('Normalized cart items:', normalizedItems);
      this.updateLocalCart(normalizedItems);
    });
  }

  /**
   * Add product to cart
   */
  addToCart(product: any): void {
    const userId = this.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return;
    }

    const requestBody = {
      productId: product.id,
      quantity: 1
    };

    console.log('Adding to cart:', product.name, 'userId:', userId);

    this.http.post<any>(
      `${environment.apiUrl}/cart/items?userId=${userId}`,
      requestBody,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {
        console.error('Error adding to cart:', error);
        console.error('Error status:', error.status);

        // If it's a 200 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          console.log('Add successful despite parsing error');
          this.loadCartFromBackend();
          this.toastService.success('Produit ajouté au panier');
        } else {
          this.toastService.error('Erreur lors de l\'ajout au panier');
          // Fallback to localStorage
          this.addToCartLocally(product);
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) {
        console.log('Handled in catchError');
        return;
      }

      const response = httpResponse.body;
      console.log('Add to cart response:', response);
      console.log('Response status:', httpResponse.status);
      console.log('Response items:', response?.items);

      // Handle 204 No Content
      if (httpResponse.status === 204) {
        console.log('204 No Content - reloading cart');
        this.loadCartFromBackend();
        this.toastService.success('Produit ajouté au panier');
        return;
      }

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || '/assets/images/default-product.jpg',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));

        console.log('Normalized items after add:', normalizedItems);
        this.updateLocalCart(normalizedItems);
        this.toastService.success('Produit ajouté au panier');
      } else {
        // Response doesn't have items, reload from backend
        console.warn('Response missing items array, reloading cart');
        this.loadCartFromBackend();
        this.toastService.success('Produit ajouté au panier');
      }
    });
  }

  /**
   * Update item quantity
   */
  updateQuantity(itemId: number, quantity: number): void {
    const userId = this.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return;
    }

    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    console.log('Updating quantity - itemId:', itemId, 'quantity:', quantity);

    this.http.put<any>(
      `${environment.apiUrl}/cart/items/${itemId}?userId=${userId}&quantity=${quantity}`,
      {},
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {
        console.error('Error updating quantity:', error);
        console.error('Error status:', error.status);

        // If it's a 200/204 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          console.log('Update successful despite parsing error');
          this.loadCartFromBackend();
          this.toastService.success('Quantité mise à jour');
        } else {
          this.toastService.error('Erreur lors de la mise à jour');
          // Fallback to localStorage
          this.updateQuantityLocally(itemId, quantity);
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) {
        console.log('Handled in catchError');
        return;
      }

      const response = httpResponse.body;
      console.log('Update quantity response:', response);
      console.log('Response status:', httpResponse.status);
      console.log('Response items:', response?.items);

      // Handle 204 No Content
      if (httpResponse.status === 204) {
        console.log('204 No Content - reloading cart');
        this.loadCartFromBackend();
        this.toastService.success('Quantité mise à jour');
        return;
      }

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || '/assets/images/default-product.jpg',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));

        console.log('Normalized items after update:', normalizedItems);
        this.updateLocalCart(normalizedItems);
        this.toastService.success('Quantité mise à jour');
      } else {
        // No items in response - reload cart
        console.warn('Response missing items array, reloading cart');
        this.loadCartFromBackend();
        this.toastService.success('Quantité mise à jour');
      }
    });
  }

  /**
   * Remove item from cart
   */
  removeFromCart(itemId: number): void {
    const userId = this.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return;
    }

    console.log('Removing item from cart - itemId:', itemId, 'userId:', userId);
    console.log('DELETE URL:', `${environment.apiUrl}/cart/items/${itemId}?userId=${userId}`);

    this.http.delete<any>(
      `${environment.apiUrl}/cart/items/${itemId}?userId=${userId}`,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {
        console.error('Error removing from cart:', error);
        console.error('Error status:', error.status);

        // If it's a 200/204 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          console.log('Delete successful despite parsing error');
          this.loadCartFromBackend();
          this.toastService.success('Produit retiré du panier');
        } else {
          this.toastService.error('Erreur lors de la suppression');
          // Fallback to localStorage
          this.removeFromCartLocally(itemId);
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) {
        console.log('Handled in catchError');
        return;
      }

      const response = httpResponse.body;
      console.log('Remove from cart response:', response);
      console.log('Response status:', httpResponse.status);
      console.log('Response items:', response?.items);

      // Handle 204 No Content
      if (httpResponse.status === 204) {
        console.log('204 No Content - reloading cart');
        this.loadCartFromBackend();
        this.toastService.success('Produit retiré du panier');
        return;
      }

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || '/assets/images/default-product.jpg',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));

        console.log('Normalized items after removal:', normalizedItems);
        this.updateLocalCart(normalizedItems);
        this.toastService.success('Produit retiré du panier');
      } else {
        // No items in response or empty response - reload cart
        console.warn('Response missing items array, reloading cart');
        this.loadCartFromBackend();
        this.toastService.success('Produit retiré du panier');
      }
    });
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    const userId = this.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return;
    }

    this.http.delete<CartResponse>(
      `${environment.apiUrl}/cart?userId=${userId}`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Error clearing cart:', error);
        // Fallback to localStorage
        this.updateLocalCart([]);
        return of(null);
      })
    ).subscribe(response => {
      this.updateLocalCart([]);
    });
  }

  /**
   * Checkout - Convert cart to order
   */
  checkout(deliveryAddress: string): Observable<any> {
    const userId = this.getUserId();
    if (!userId) {
      return of({ error: 'User not logged in' });
    }

    const requestBody = {
      deliveryAddress: deliveryAddress
    };

    return this.http.post(
      `${environment.apiUrl}/cart/orders/checkout?userId=${userId}`,
      requestBody,
      {
        withCredentials: true,
        responseType: 'text' as 'json' // Backend returns text, not JSON
      }
    ).pipe(
      tap(() => {
        // Clear cart after successful checkout
        this.updateLocalCart([]);
      }),
      map((response: any) => {
        // If response is text, wrap it in an object
        if (typeof response === 'string') {
          return { success: true, message: response };
        }
        return response;
      }),
      catchError(error => {
        console.error('Error during checkout:', error);
        return of({ error: error.message || 'Checkout failed' });
      })
    );
  }

  /**
   * Get cart total
   */
  getCartTotal(): number {
    const currentItems = this.cartItems.getValue();
    return currentItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // ========== LOCAL FALLBACK METHODS (for offline support) ==========

  private updateLocalCart(items: CartItem[]): void {
    console.log('Updating local cart with items:', items);
    const count = items.reduce((count, item) => count + item.quantity, 0);
    console.log('New cart count:', count);

    // Force new array reference to trigger change detection
    this.cartItems.next([...items]);
    this.cartCount.next(count);
    this.saveCartToStorage(items);
  }

  private addToCartLocally(product: any): void {
    const currentItems = this.cartItems.getValue();
    const existingItem = currentItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl || product.image || '/assets/images/default-product.jpg',
        category: product.category,
        subCategory: product.subCategory
      };
      currentItems.push(newItem);
    }

    this.updateLocalCart(currentItems);
  }

  private updateQuantityLocally(productId: number, quantity: number): void {
    const currentItems = this.cartItems.getValue();
    const item = currentItems.find(item => item.id === productId);

    if (item) {
      if (quantity > 0) {
        item.quantity = quantity;
      } else {
        this.removeFromCartLocally(productId);
        return;
      }
    }

    this.updateLocalCart(currentItems);
  }

  private removeFromCartLocally(productId: number): void {
    const currentItems = this.cartItems.getValue();
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.updateLocalCart(updatedItems);
  }

  private saveCartToStorage(items: CartItem[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        this.updateLocalCart(items);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        this.updateLocalCart([]);
      }
    }
  }
}