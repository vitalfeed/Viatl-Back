import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { FormulaireComponent } from './components/formulaire/formulaire.component';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { LoginComponent } from './components/login/login.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminProductsComponent } from './components/admin-products/admin-products.component';
import { AdminSubscriptionsComponent } from './components/admin-subscriptions/admin-subscriptions.component';
import { AdminVeterinairesComponent } from './components/admin-veterinaires/admin-veterinaires.component';
import { AdminBoutiquesComponent } from './components/admin-boutiques/admin-boutiques.component';
import { EspaceProprietaireComponent } from './components/espace-proprietaire/espace-proprietaire.component';
import { OuTrouverNosProduitsComponent } from './components/ou-trouver-nos-produits/ou-trouver-nos-produits.component';
import { EspaceVeterinaireComponent } from './components/espace-veterinaire/espace-veterinaire.component';
import { ProduitsVeterinaireComponent } from './components/produits-veterinaire/produits-veterinaire.component';
import { PanierComponent } from './components/panier/panier.component';
import { FormulaireVetComponent } from './components/formulaire-vet/formulaire-vet.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'formulaireUser', component: FormulaireComponent },
  { path: 'formulaireVet', component: FormulaireVetComponent },
  { path: 'confirmation', component: ConfirmationComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'subscriptions', component: AdminSubscriptionsComponent },
      { path: 'veterinaires', component: AdminVeterinairesComponent },
      { path: 'boutiques', component: AdminBoutiquesComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'users', component: AdminComponent }
    ]
  },
  { path: 'espace-proprietaire', component: EspaceProprietaireComponent },
  { path: 'ou-trouver-nos-produits', component: OuTrouverNosProduitsComponent },
  { path: 'espace-veterinaire', component: EspaceVeterinaireComponent, canActivate: [authGuard] },
  { path: 'produits-veterinaire', component: ProduitsVeterinaireComponent, canActivate: [authGuard] },
  { path: 'panier', component: PanierComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];