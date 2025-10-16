import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  sidebarOpen = true;

  constructor(private router: Router) {
    this.checkAuthentication();
  }

  checkAuthentication(): void {
    const adminToken = localStorage.getItem('admin_token');
    const isAdmin = localStorage.getItem('isAdmin');
    
    if (!adminToken || isAdmin !== 'true') {
      // Redirect to login if not authenticated as admin
      this.router.navigate(['/login']);
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    // Clear all tokens and user data
    localStorage.removeItem('user_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    
    // Clear any remaining data
    localStorage.clear();
    
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      });
    }
    this.router.navigate(['/']);
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
