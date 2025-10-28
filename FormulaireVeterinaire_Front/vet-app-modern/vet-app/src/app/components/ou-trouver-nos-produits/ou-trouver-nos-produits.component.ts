import { Component, OnInit, Pipe, PipeTransform, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

@Pipe({
  name: 'sanitizeUrl',
  standalone: true
})
export class SanitizeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

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
export class OuTrouverNosProduitsComponent implements OnInit, AfterViewInit {
  isMapMaximized: boolean = false;
  locations: VeterinaryLocation[] = [];
  filteredLocations: VeterinaryLocation[] = [];
  loading: boolean = false;
  error: string = '';
  selectedFilter: string = 'all';

  // Pagination
  currentPage = 1;
  itemsPerPage = 3;
  paginatedLocations: VeterinaryLocation[] = [];
  Math = Math;

  private map: L.Map | null = null;
  private modalMap: L.Map | null = null;
  private markers: L.Marker[] = [];

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadLocations();
  }

  ngAfterViewInit(): void {
    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  /**
   * Initialize Leaflet map
   */
  initMap(): void {
    // Fix for default marker icon issue with Leaflet + Webpack
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Initialize main map
    if (!this.map) {
      this.map = L.map('map').setView([36.8, 10.2], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);
    }

    // Add markers if locations are loaded
    if (this.filteredLocations.length > 0) {
      this.updateMapMarkers();
    }
  }

  /**
   * Update map markers based on filtered locations
   */
  updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    if (this.filteredLocations.length === 0) return;

    // Add markers for each location
    const bounds: L.LatLngBoundsExpression = [];

    this.filteredLocations.forEach(location => {
      const marker = L.marker([location.latitude, location.longitude])
        .addTo(this.map!)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${location.name}</h3>
            <p style="margin: 4px 0; font-size: 12px;">📍 ${location.address}, ${location.city}</p>
            <p style="margin: 4px 0; font-size: 12px;">📞 ${location.phone}</p>
            ${location.featured ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⭐ Boutique Principale</span>' : ''}
          </div>
        `);

      this.markers.push(marker);
      bounds.push([location.latitude, location.longitude]);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
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
          this.currentPage = 1;
          this.updatePagination();
          this.loading = false;

          // Update map markers after loading
          if (this.map) {
            this.updateMapMarkers();
          }
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

    // Update pagination and map markers when filter changes
    this.currentPage = 1;
    this.updatePagination();
    this.updateMapMarkers();
  }

  /**
   * Get map URL with all markers
   * Note: OpenStreetMap embed only supports one marker, so we'll use the first location
   * For multiple markers, consider using Leaflet.js or Google Maps API
   */
  getMapUrl(): string {
    if (this.filteredLocations.length === 0) {
      return 'https://www.openstreetmap.org/export/embed.html?bbox=9.0,36.0,11.0,38.0&layer=mapnik';
    }

    // If only one location, show it directly
    if (this.filteredLocations.length === 1) {
      const loc = this.filteredLocations[0];
      const zoom = 15;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.01},${loc.latitude - 0.01},${loc.longitude + 0.01},${loc.latitude + 0.01}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`;
    }

    // For multiple locations, calculate bounds and show center
    const lats = this.filteredLocations.map(loc => loc.latitude);
    const lngs = this.filteredLocations.map(loc => loc.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding to bounds (10%)
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Show first location as marker (OSM limitation)
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}&layer=mapnik&marker=${this.filteredLocations[0].latitude},${this.filteredLocations[0].longitude}`;
  }

  /**
   * Get Google Maps URL with all markers using My Maps approach
   */
  getGoogleMapsUrl(): string {
    if (this.filteredLocations.length === 0) {
      return 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d100000!2d10.2!3d36.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1234567890';
    }

    // For single location
    if (this.filteredLocations.length === 1) {
      const loc = this.filteredLocations[0];
      return `https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // For multiple locations, create a search query with all locations
    // This will show multiple markers on the map
    const queries = this.filteredLocations.map(loc =>
      `${loc.latitude},${loc.longitude}`
    ).join('|');

    // Calculate center
    const lats = this.filteredLocations.map(loc => loc.latitude);
    const lngs = this.filteredLocations.map(loc => loc.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Use the first location as primary marker, but center on all
    return `https://maps.google.com/maps?q=${queries.split('|')[0]}&t=&z=12&ie=UTF8&iwloc=&output=embed&center=${centerLat},${centerLng}`;
  }

  /**
   * Get URL to view all locations on Google Maps (opens in new tab)
   * Opens Google Maps with all locations visible
   */
  viewAllOnGoogleMaps(): void {
    if (this.filteredLocations.length === 0) return;

    if (this.filteredLocations.length === 1) {
      // Single location - open directly
      const loc = this.filteredLocations[0];
      const url = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
      window.open(url, '_blank');
      return;
    }

    // For multiple locations, use the directions API which shows all points as markers
    // This is the most reliable way to show multiple markers without API key
    const coordinates = this.filteredLocations.map(loc =>
      `${loc.latitude},${loc.longitude}`
    ).join('/');

    const url = `https://www.google.com/maps/dir/${coordinates}`;
    window.open(url, '_blank');
  }

  /**
   * Get directions to location
   */
  getDirections(location: VeterinaryLocation): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * View location on map
   */
  viewOnMap(location: VeterinaryLocation): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * Call location
   */
  callLocation(phone: string): void {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  navigateToVetSpace() {
    this.router.navigate(['/formulaireUser']);
  }

  navigateBack() {
    this.router.navigate(['/espace-proprietaire']);
  }

  maximizeMap() {
    this.isMapMaximized = true;
    document.body.style.overflow = 'hidden';

    // Initialize modal map after a short delay
    setTimeout(() => {
      if (!this.modalMap) {
        this.modalMap = L.map('modalMap').setView([36.8, 10.2], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.modalMap);

        // Add markers to modal map
        const bounds: L.LatLngBoundsExpression = [];
        this.filteredLocations.forEach(location => {
          L.marker([location.latitude, location.longitude])
            .addTo(this.modalMap!)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${location.name}</h3>
                <p style="margin: 4px 0; font-size: 12px;">📍 ${location.address}, ${location.city}</p>
                <p style="margin: 4px 0; font-size: 12px;">📞 ${location.phone}</p>
                ${location.featured ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⭐ Boutique Principale</span>' : ''}
              </div>
            `);
          bounds.push([location.latitude, location.longitude]);
        });

        if (bounds.length > 0) {
          this.modalMap.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, 100);
  }

  minimizeMap() {
    this.isMapMaximized = false;
    document.body.style.overflow = 'auto';

    // Clean up modal map
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = null;
    }
  }

  /**
   * Update pagination
   */
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLocations = this.filteredLocations.slice(startIndex, endIndex);
  }

  /**
   * Get total pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredLocations.length / this.itemsPerPage);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Get page numbers array
   */
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
