import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'vet-app';
  currentRoute: string = '';
  cartItemsCount: number = 0;
  selectedProductFilter: string = 'tous';
  selectedSubType: string = '';
  sidebarOpen: boolean = true;
  produitsSidebarOpen: boolean = true;
  
  // Available product types based on actual products
  availableProductTypes = [
    { key: 'aliment', label: 'Aliment', animals: ['chien', 'chat'] },
    { key: 'complement', label: 'Complément', animals: ['chien', 'chat'] },
    { key: 'test-rapide', label: 'Test rapide', animals: ['chien', 'chat'] }
  ];

  constructor(private router: Router, private cartService: CartService) {
    // Listen to route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentRoute = event.urlAfterRedirects;
      // Reset filters when route changes
      this.selectedProductFilter = 'tous';
      this.selectedSubType = '';
    });

    // Subscribe to cart count changes
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemsCount = count;
    });
  }

  get isAdmin(): boolean {
    return !!localStorage.getItem('admin_token');
  }

  get isEspaceProprietaire(): boolean {
    return this.currentRoute.includes('/espace-proprietaire');
  }

  get isEspaceVeterinaire(): boolean {
    return this.currentRoute.includes('/espace-veterinaire');
  }

  get isProduitsVeterinaire(): boolean {
    return this.currentRoute.includes('/produits-veterinaire');
  }

  get navbarTitle(): string {
    return 'VITALFEED';
  }

  get showCart(): boolean {
    return this.isEspaceProprietaire || this.isProduitsVeterinaire;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProduitsSidebar() {
    this.produitsSidebarOpen = !this.produitsSidebarOpen;
  }

  getAvailableSubTypes() {
    if (this.selectedProductFilter === 'tous') {
      return [];
    }
    // Always return all 3 types for both chien and chat
    return this.availableProductTypes;
  }

  selectProductFilter(filter: string) {
    this.selectedProductFilter = filter;
    this.selectedSubType = '';
    
    // Determine which page to navigate to based on current route
    const targetRoute = this.isEspaceProprietaire ? '/espace-proprietaire' : '/produits-veterinaire';
    
    if (filter === 'tous') {
      // Show all products from both animals and all types
      this.router.navigate([targetRoute], { queryParams: {} });
    } else {
      // Navigate with animal filter only
      this.router.navigate([targetRoute], { 
        queryParams: { animal: filter }
      });
    }
  }

  selectSubType(type: string) {
    // Determine which page to navigate to based on current route
    const targetRoute = this.isEspaceProprietaire ? '/espace-proprietaire' : '/produits-veterinaire';
    
    // Toggle selection - if already selected, deselect it
    if (this.selectedSubType === type) {
      this.selectedSubType = '';
      // Navigate with only animal filter
      if (this.selectedProductFilter === 'tous') {
        this.router.navigate([targetRoute], { queryParams: {} });
      } else {
        this.router.navigate([targetRoute], { 
          queryParams: { animal: this.selectedProductFilter }
        });
      }
    } else {
      this.selectedSubType = type;
      
      if (this.selectedProductFilter === 'tous') {
        // If "tous" is selected, filter by product type only (all animals)
        this.router.navigate([targetRoute], { 
          queryParams: { type: type }
        });
      } else {
        // Filter by both animal and product type
        this.router.navigate([targetRoute], { 
          queryParams: { 
            animal: this.selectedProductFilter, 
            type: type 
          }
        });
      }
    }
  }

  navigateToProductLocations() {
    this.router.navigate(['/ou-trouver-nos-produits']);
  }

  navigateToVetSpace() {
    this.router.navigate(['/espace-veterinaire']);
  }

  logout() {
    localStorage.clear();
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      });
    }
    window.location.href = '/';
  }
}