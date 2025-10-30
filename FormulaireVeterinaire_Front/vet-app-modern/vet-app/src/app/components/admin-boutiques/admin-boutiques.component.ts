import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Boutique {
  id?: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  featured: boolean;  // Changed from isFeatured to match API
  type: string;
  matricule: string;
}

@Component({
  selector: 'app-admin-boutiques',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-boutiques.component.html',
  styleUrl: './admin-boutiques.component.scss'
})
export class AdminBoutiquesComponent implements OnInit {
  boutiques: Boutique[] = [];
  loading = false;
  error = '';
  successMessage = '';
  filterFeatured = false; // Filter to show only featured boutiques

  // Form state
  showForm = false;
  isEditing = false;
  currentBoutique: Boutique = this.getEmptyBoutique();

  // Delete confirmation
  showDeleteModal = false;
  boutiqueToDelete: Boutique | null = null;

  // Map modal
  showMapModal = false;
  private modalMap: any = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadBoutiques();
  }

  /**
   * Get empty boutique object
   */
  getEmptyBoutique(): Boutique {
    return {
      name: '',
      address: '',
      city: '',
      phone: '',
      latitude: 0,
      longitude: 0,
      featured: false,
      type: 'BOUTIQUE',
      matricule: ''
    };
  }

  /**
   * Get request options with credentials
   * Cookie is automatically sent by browser when withCredentials is true
   */
  private getRequestOptions() {
    return {
      withCredentials: true
    };
  }

  /**
   * Load all boutiques
   */
  loadBoutiques(): void {
    this.loading = true;
    this.error = '';

    this.http.get<Boutique[]>(`${environment.apiUrl}/cabinets/all`, this.getRequestOptions())
      .subscribe({
        next: (data) => {
          this.boutiques = data.filter(b => b.type === 'BOUTIQUE');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading boutiques:', error);
          this.error = 'Erreur lors du chargement des boutiques';
          this.loading = false;
        }
      });
  }

  /**
   * Open form for adding new boutique
   */
  openAddForm(): void {
    this.isEditing = false;
    this.currentBoutique = this.getEmptyBoutique();
    this.showForm = true;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Open form for editing boutique
   */
  openEditForm(boutique: Boutique): void {
    this.isEditing = true;
    this.currentBoutique = { ...boutique };
    this.showForm = true;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Close form
   */
  closeForm(): void {
    this.showForm = false;
    this.currentBoutique = this.getEmptyBoutique();
    this.error = '';
  }

  /**
   * Save boutique (add or update)
   */
  saveBoutique(): void {
    // Validation
    if (!this.currentBoutique.name || !this.currentBoutique.address ||
      !this.currentBoutique.city || !this.currentBoutique.phone ||
      !this.currentBoutique.matricule) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Validate GPS coordinates are numbers
    const lat = Number(this.currentBoutique.latitude);
    const lng = Number(this.currentBoutique.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      this.error = '❌ Les coordonnées GPS doivent être des nombres valides (ex: 48.8566 pour la latitude, 2.3522 pour la longitude)';
      return;
    }

    if (lat === 0 || lng === 0) {
      this.error = 'Veuillez entrer des coordonnées GPS valides';
      return;
    }

    // Ensure coordinates are numbers
    this.currentBoutique.latitude = lat;
    this.currentBoutique.longitude = lng;

    this.loading = true;
    this.error = '';

    if (this.isEditing && this.currentBoutique.id) {
      // Update existing boutique
      this.updateBoutique();
    } else {
      // Add new boutique
      this.addBoutique();
    }
  }

  /**
   * Add new boutique
   */
  addBoutique(): void {
    const boutiqueData = { ...this.currentBoutique };
    boutiqueData.type = 'BOUTIQUE'; // Force type to BOUTIQUE

    this.http.post<any>(`${environment.apiUrl}/cabinets/add`, boutiqueData, this.getRequestOptions())
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Boutique ajoutée avec succès!';
          this.closeForm();
          this.loadBoutiques();

          // Clear success message after 3 seconds
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error adding boutique:', error);

          // Handle specific error messages
          let errorMessage = 'Erreur lors de l\'ajout de la boutique';

          if (error.status === 400) {
            const errorText = error.error?.message || error.error?.error || error.error || '';

            // Check for matricule not found error
            if (errorText.includes('matricule') && errorText.includes('n\'existe pas')) {
              const matriculeMatch = errorText.match(/Le matricule ([^\s]+)/);
              const matricule = matriculeMatch ? matriculeMatch[1] : this.currentBoutique.matricule;
              errorMessage = `❌ Matricule invalide : Le matricule "${matricule}" n'existe pas dans la base de données des vétérinaires. Veuillez vérifier le matricule ou ajouter d'abord le vétérinaire.`;
            }
            // Check for JSON parse error (invalid number format)
            else if (errorText.includes('JSON parse error') || errorText.includes('Cannot deserialize') || errorText.includes('not a valid')) {
              if (errorText.includes('double') || errorText.includes('latitude') || errorText.includes('longitude')) {
                errorMessage = '❌ Format de coordonnées invalide : Les coordonnées GPS (latitude et longitude) doivent être des nombres décimaux valides. Exemple: 48.8566 ou 2.3522';
              } else {
                errorMessage = '❌ Format de données invalide : Veuillez vérifier que tous les champs contiennent des valeurs valides.';
              }
            }
            else {
              errorMessage = errorText || errorMessage;
            }
          }

          this.error = errorMessage;
        }
      });
  }

  /**
   * Update existing boutique
   */
  updateBoutique(): void {
    const boutiqueData = { ...this.currentBoutique };

    this.http.put<any>(`${environment.apiUrl}/cabinets/update/${this.currentBoutique.id}`, boutiqueData, this.getRequestOptions())
      .subscribe({
        next: (response) => {
          // Immediately update in local array for instant UI update
          const index = this.boutiques.findIndex(b => b.id === this.currentBoutique.id);
          if (index !== -1) {
            this.boutiques[index] = { ...this.currentBoutique };
          }

          this.loading = false;
          this.successMessage = 'Boutique modifiée avec succès!';
          this.closeForm();

          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error updating boutique:', error);

          // Handle specific error messages
          let errorMessage = 'Erreur lors de la modification de la boutique';

          if (error.status === 400) {
            const errorText = error.error?.message || error.error?.error || error.error || '';

            // Check for matricule not found error
            if (errorText.includes('matricule') && errorText.includes('n\'existe pas')) {
              const matriculeMatch = errorText.match(/Le matricule ([^\s]+)/);
              const matricule = matriculeMatch ? matriculeMatch[1] : this.currentBoutique.matricule;
              errorMessage = `❌ Matricule invalide : Le matricule "${matricule}" n'existe pas dans la base de données des vétérinaires. Veuillez vérifier le matricule ou ajouter d'abord le vétérinaire.`;
            }
            // Check for JSON parse error (invalid number format)
            else if (errorText.includes('JSON parse error') || errorText.includes('Cannot deserialize') || errorText.includes('not a valid')) {
              if (errorText.includes('double') || errorText.includes('latitude') || errorText.includes('longitude')) {
                errorMessage = '❌ Format de coordonnées invalide : Les coordonnées GPS (latitude et longitude) doivent être des nombres décimaux valides. Exemple: 48.8566 ou 2.3522';
              } else {
                errorMessage = '❌ Format de données invalide : Veuillez vérifier que tous les champs contiennent des valeurs valides.';
              }
            }
            else {
              errorMessage = errorText || errorMessage;
            }
          }

          this.error = errorMessage;
        }
      });
  }

  /**
   * Open delete confirmation modal
   */
  confirmDelete(boutique: Boutique): void {
    this.boutiqueToDelete = boutique;
    this.showDeleteModal = true;
  }

  /**
   * Close delete modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.boutiqueToDelete = null;
  }

  /**
   * Delete boutique
   */
  deleteBoutique(): void {
    if (!this.boutiqueToDelete?.id) return;

    const deletedId = this.boutiqueToDelete.id;
    this.loading = true;
    this.error = '';

    const options = {
      withCredentials: true,
      responseType: 'text' as 'json'
    };

    this.http.delete<any>(`${environment.apiUrl}/cabinets/delete/${deletedId}`, options)
      .subscribe({
        next: (response) => {
          // Immediately remove from local array for instant UI update
          this.boutiques = this.boutiques.filter(b => b.id !== deletedId);

          this.loading = false;
          this.successMessage = 'Boutique supprimée avec succès!';
          this.closeDeleteModal();

          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          // Check if it's actually a success (status 200) but treated as error due to response format
          if (error.status === 200) {
            // Treat as success
            this.boutiques = this.boutiques.filter(b => b.id !== deletedId);
            this.loading = false;
            this.successMessage = 'Boutique supprimée avec succès!';
            this.closeDeleteModal();
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.loading = false;
            console.error('Error deleting boutique:', error);
            this.error = error.error?.message || 'Erreur lors de la suppression de la boutique';
            this.closeDeleteModal();
          }
        }
      });
  }

  /**
   * Get featured boutiques count
   */
  get featuredCount(): number {
    return this.boutiques.filter(b => b.featured).length;
  }

  /**
   * Get filtered boutiques based on filter
   */
  get filteredBoutiques(): Boutique[] {
    if (this.filterFeatured) {
      return this.boutiques.filter(b => b.featured);
    }
    return this.boutiques;
  }

  /**
   * Toggle featured filter
   */
  toggleFeaturedFilter(): void {
    this.filterFeatured = !this.filterFeatured;
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterFeatured = false;
  }

  /**
   * Open map modal
   */
  openMapModal(): void {
    this.showMapModal = true;
    document.body.style.overflow = 'hidden';

    // Initialize modal map after a short delay
    setTimeout(() => {
      if (!this.modalMap && typeof window !== 'undefined' && (window as any).L) {
        const L = (window as any).L;

        this.modalMap = L.map('adminModalMap').setView([36.8, 10.2], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.modalMap);

        // Add markers for all boutiques
        const bounds: any[] = [];
        this.boutiques.forEach((boutique: Boutique) => {
          const marker = L.marker([boutique.latitude, boutique.longitude])
            .addTo(this.modalMap)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${boutique.name}</h3>
                <p style="margin: 4px 0; font-size: 12px;">📍 ${boutique.address}, ${boutique.city}</p>
                <p style="margin: 4px 0; font-size: 12px;">📞 ${boutique.phone}</p>
                <p style="margin: 4px 0; font-size: 11px; color: #666;">🔖 ${boutique.matricule}</p>
                ${boutique.featured ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⭐ Boutique Principale</span>' : ''}
              </div>
            `);
          bounds.push([boutique.latitude, boutique.longitude]);
        });

        if (bounds.length > 0) {
          this.modalMap.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, 100);
  }

  /**
   * Close map modal
   */
  closeMapModal(): void {
    this.showMapModal = false;
    document.body.style.overflow = 'auto';

    // Clean up modal map
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = null;
    }
  }
}
