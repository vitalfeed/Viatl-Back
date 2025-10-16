import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
  subCategory: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  private cartCount = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCount.asObservable();

  constructor() {
    // Load cart from localStorage on service initialization
    this.loadCartFromStorage();
  }

  addToCart(product: any): void {
    const currentItems = this.cartItems.getValue();
    const existingItem = currentItems.find(item => item.id === product.id);

    if (existingItem) {
      // Increase quantity if item already exists
      existingItem.quantity += 1;
    } else {
      // Add new item to cart
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

    this.updateCart(currentItems);
  }

  removeFromCart(productId: number): void {
    const currentItems = this.cartItems.getValue();
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.updateCart(updatedItems);
  }

  updateQuantity(productId: number, quantity: number): void {
    const currentItems = this.cartItems.getValue();
    const item = currentItems.find(item => item.id === productId);
    
    if (item) {
      if (quantity > 0) {
        item.quantity = quantity;
      } else {
        // Remove item if quantity is 0
        this.removeFromCart(productId);
        return;
      }
    }

    this.updateCart(currentItems);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  getCartTotal(): number {
    const currentItems = this.cartItems.getValue();
    return currentItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    this.cartCount.next(items.reduce((count, item) => count + item.quantity, 0));
    this.saveCartToStorage(items);
  }

  private saveCartToStorage(items: CartItem[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      this.updateCart(items);
    }
  }
}