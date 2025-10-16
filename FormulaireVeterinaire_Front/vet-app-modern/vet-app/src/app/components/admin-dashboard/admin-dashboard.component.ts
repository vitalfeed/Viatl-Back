import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalProducts: 0,
    pendingRequests: 0
  };

  loading = true;
  error = '';

  constructor(
    private http: HttpClient,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  loadStats() {
    this.loading = true;
    this.error = '';

    // Fetch all data in parallel with individual error handling
    forkJoin({
      products: this.productService.getAllProducts().pipe(
        catchError(err => {
          console.error('Error loading products:', err);
          return of([]);
        })
      ),
      users: this.http.get<any[]>(`${environment.apiUrl}/users`, this.getAuthHeaders()).pipe(
        catchError(err => {
          console.error('Error loading users:', err);
          return of([]);
        })
      ),
      demandes: this.http.get<any[]>(`${environment.apiUrl}/demandes`, this.getAuthHeaders()).pipe(
        catchError(err => {
          console.error('Error loading demandes:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: (data) => {
        // Count products
        this.stats.totalProducts = data.products?.length || 0;

        // Count users with subscriptions
        const users = data.users || [];
        const usersWithSubscriptions = users.filter((user: any) => user.subscription);
        this.stats.totalSubscriptions = usersWithSubscriptions.length;
        this.stats.activeSubscriptions = usersWithSubscriptions.filter((user: any) => 
          user.subscription?.status === 'ACTIVE'
        ).length;

        // Count pending requests
        this.stats.pendingRequests = data.demandes?.length || 0;

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.error = 'Erreur lors du chargement des statistiques';
        this.loading = false;
      }
    });
  }
}
