import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { FormulaireComponent } from './components/formulaire/formulaire.component';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { LoginComponent } from './components/login/login.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminProductsComponent } from './components/admin-products/admin-products.component';
import { EspaceProprietaireComponent } from './components/espace-proprietaire/espace-proprietaire.component';
import { OuTrouverNosProduitsComponent } from './components/ou-trouver-nos-produits/ou-trouver-nos-produits.component';
import { EspaceVeterinaireComponent } from './components/espace-veterinaire/espace-veterinaire.component';
import { ProduitsVeterinaireComponent } from './components/produits-veterinaire/produits-veterinaire.component';
import { PanierComponent } from './components/panier/panier.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'formulaireUser', component: FormulaireComponent },
  { path: 'confirmation', component: ConfirmationComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'subscriptions', component: AdminComponent },
      { path: 'products', component: AdminProductsComponent }
    ]
  },
  { path: 'espace-proprietaire', component: EspaceProprietaireComponent },
  { path: 'ou-trouver-nos-produits', component: OuTrouverNosProduitsComponent },
  { path: 'espace-veterinaire', component: EspaceVeterinaireComponent },
  { path: 'produits-veterinaire', component: ProduitsVeterinaireComponent },
  { path: 'panier', component: PanierComponent },
  { path: '**', redirectTo: '' },
];