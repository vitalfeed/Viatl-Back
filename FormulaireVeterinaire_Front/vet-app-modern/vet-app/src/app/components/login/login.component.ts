import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get f() { return this.loginForm.controls; }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // withCredentials: true allows browser to receive and store HttpOnly cookies
    this.http.post<any>(`${environment.apiUrl}/login`, loginData, { withCredentials: true }).subscribe({
      next: (response) => {
        // Backend sets HttpOnly cookie automatically
        // No need to manually store token - browser handles it
        if (response) {
          // Check for isAdmin in different formats
          const isAdmin = response.isAdmin === true ||
            response.isAdmin === 'true' ||
            response.admin === true ||
            response.role === 'ADMIN';

          // Only store non-sensitive user info
          if (isAdmin) {
            localStorage.setItem('isAdmin', 'true');
            this.loading = false;
            this.router.navigate(['/admin']);
          } else {
            localStorage.setItem('isAdmin', 'false');

            // Store userId for non-admin users
            if (response.userId || response.id) {
              const userId = response.userId || response.id;
              localStorage.setItem('userId', userId.toString());
            }

            // Store user name if available
            if (response.nom || response.prenom) {
              const fullName = `${response.prenom || ''} ${response.nom || ''}`.trim();
              localStorage.setItem('userFullName', fullName);
            }

            // If userId is not in response, fetch current user info
            if (!response.userId && !response.id) {
              this.fetchCurrentUserInfo();
            } else {
              this.loading = false;
              this.router.navigate(['/espace-veterinaire']);
            }
          }
        } else {
          this.loading = false;
          this.error = "Identifiants invalides ou réponse inattendue.";
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        console.error('Login error:', error);

        // User-friendly error messages
        if (error.status === 401) {
          this.error = "Email ou mot de passe incorrect.";
        } else if (error.status === 404) {
          this.error = "Utilisateur non trouvé.";
        } else if (error.status === 500) {
          this.error = "Erreur serveur. Veuillez réessayer plus tard.";
        } else {
          this.error = "Erreur lors de la connexion. Veuillez réessayer.";
        }
      }
    });
  }

  /**
   * Fetch current user info after login (when userId is not in login response)
   */
  fetchCurrentUserInfo(): void {
    // Get current user info from /api/veterinaires/me endpoint
    this.http.get<any>(`${environment.apiUrl}/veterinaires/me`, { withCredentials: true }).subscribe({
      next: (userData) => {
        this.storeUserData(userData);
        this.loading = false;
        this.router.navigate(['/espace-veterinaire']);
      },
      error: (error) => {
        console.error('Error fetching from /api/veterinaires/me:', error);

        // If 401, the backend might be rejecting non-ACTIVE users
        // This is a backend issue - /me should work for all authenticated users
        // For now, navigate anyway and let the page handle it
        this.loading = false;
        console.warn('Navigating to /espace-veterinaire despite error (backend should fix /me endpoint)');
        this.router.navigate(['/espace-veterinaire']);
      }
    });
  }

  /**
   * Store user data in localStorage
   */
  private storeUserData(userData: any): void {
    if (userData.id || userData.userId) {
      const userId = userData.id || userData.userId;
      localStorage.setItem('userId', userId.toString());
    }

    if (userData.nom || userData.prenom) {
      const fullName = `${userData.prenom || ''} ${userData.nom || ''}`.trim();
      localStorage.setItem('userFullName', fullName);
    }
  }
} 