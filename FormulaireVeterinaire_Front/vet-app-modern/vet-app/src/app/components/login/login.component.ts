import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';

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

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get f() { return this.loginForm.controls; }

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

    this.http.post<any>('http://localhost:8061/api/login', loginData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Login response:', response);
        
        if (response && response.token) {
          // Check if user is admin and store token accordingly
          if (response.isAdmin === true) {
            localStorage.setItem('admin_token', response.token);
            localStorage.setItem('isAdmin', 'true');
            this.router.navigate(['/admin']);
          } else {
            localStorage.setItem('user_token', response.token);
            localStorage.setItem('isAdmin', 'false');
            
            // Store userId for non-admin users
            if (response.userId) {
              localStorage.setItem('userId', response.userId.toString());
            }
            
            this.router.navigate(['/espace-veterinaire']);
          }
        } else {
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
} 