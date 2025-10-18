import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'sanitizeUrl',
  standalone: true
})
export class SanitizeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

interface VeterinaryLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  type: string;
  featured: boolean;
}

@Component({
  selector: 'app-ou-trouver-nos-produits',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SanitizeUrlPipe],
  templateUrl: './ou-trouver-nos-produits.component.html',
  styleUrls: ['./ou-trouver-nos-produits.component.scss']
})
export class OuTrouverNosProduitsComponent implements OnInit {
  isMapMaximized: boolean = false;
  locations: VeterinaryLocation[] = [];
  filteredLocations: VeterinaryLocation[] = [];
  loading: boolean = false;
  error: string = '';
  selectedFilter: string = 'all';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  /**
   * Load veterinary locations from API
   */
  loadLocations(): void {
    this.loading = true;
    this.error = '';

    this.http.get<VeterinaryLocation[]>(`${environment.apiUrl}/cabinets/all`)
      .subscribe({
        next: (response) => {
          this.locations = response;
          this.filteredLocations = this.locations;
          this.loading = false;
          console.log('Loaded locations:', this.locations);
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.error = 'Erreur lors du chargement des cabinets';
          this.loading = false;
        }
      });
  }



  /**
   * Filter locations by type
   */
  filterLocations(filter: string): void {
    this.selectedFilter = filter;
    
    if (filter === 'all') {
      this.filteredLocations = this.locations;
    } else if (filter === 'featured') {
      this.filteredLocations = this.locations.filter(loc => loc.featured);
    } else if (filter === 'BOUTIQUE') {
      this.filteredLocations = this.locations.filter(loc => loc.type === 'BOUTIQUE');
    } else if (filter === 'CABINET') {
      this.filteredLocations = this.locations.filter(loc => loc.type === 'CABINET');
    } else {
      this.filteredLocations = this.locations.filter(loc => loc.type.toLowerCase() === filter.toLowerCase());
    }
  }

  /**
   * Get map URL with all markers
   */
  getMapUrl(): string {
    if (this.filteredLocations.length === 0) {
      return 'https://www.openstreetmap.org/export/embed.html?bbox=2.224,48.815,2.469,48.902&layer=mapnik';
    }

    // Calculate center and bounds
    const lats = this.filteredLocations.map(loc => loc.latitude);
    const lngs = this.filteredLocations.map(loc => loc.longitude);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...lngs)},${Math.min(...lats)},${Math.max(...lngs)},${Math.max(...lats)}&layer=mapnik&marker=${centerLat},${centerLng}`;
  }

  /**
   * Get directions to location
   */
  getDirections(location: VeterinaryLocation): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * Call location
   */
  callLocation(phone: string): void {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  navigateToVetSpace() {
    this.router.navigate(['/espace-veterinaire']);
  }

  navigateBack() {
    this.router.navigate(['/espace-proprietaire']);
  }

  maximizeMap() {
    this.isMapMaximized = true;
    document.body.style.overflow = 'hidden';
  }

  minimizeMap() {
    this.isMapMaximized = false;
    document.body.style.overflow = 'auto';
  }
}
