import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  /**
   * Get authorization headers with admin token
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Get all products from backend
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/all`, this.getAuthHeaders()).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(products => this.normalizeProducts(products)),
      catchError(this.handleError)
    );
  }

  /**
   * Update a product
   */
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update/${id}`, product, this.getAuthHeaders()).pipe(
      catchError(this.handleUpdateError)
    );
  }

  /**
   * Delete a product
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`, this.getAuthHeaders()).pipe(
      catchError(this.handleDeleteError)
    );
  }

  /**
   * Add a new product
   */
  addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/add`, product, this.getAuthHeaders()).pipe(
      catchError(this.handleAddError)
    );
  }

  /**
   * Handle update errors
   */
  private handleUpdateError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la mise à jour du produit.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Update Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle delete errors
   */
  private handleDeleteError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la suppression du produit.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Delete Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle add errors
   */
  private handleAddError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de l\'ajout du produit.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Add Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Normalize product data from backend
   * Converts category/subCategory to display format
   */
  private normalizeProducts(products: Product[]): Product[] {
    return products.map(product => ({
      ...product,
      // Keep original values for filtering
      category: product.category,
      subCategory: product.subCategory
    }));
  }

  /**
   * Get display label for category
   */
  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'CHAT': 'Chat',
      'CHIEN': 'Chien'
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
      'TEST_RAPIDE': 'Test rapide'
    };
    return labels[subCategory] || subCategory;
  }

  /**
   * Get emoji for category
   */
  getCategoryEmoji(category: string): string {
    return category === 'CHIEN' ? '🐶' : '🐱';
  }

  /**
   * Get emoji for sub-category
   */
  getSubCategoryEmoji(subCategory: string): string {
    const emojis: { [key: string]: string } = {
      'ALIMENT': '🍖',
      'COMPLEMENT': '💊',
      'TEST_RAPIDE': '🧪'
    };
    return emojis[subCategory] || '📦';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors du chargement des produits.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
