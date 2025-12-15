import { Routes } from '@angular/router';
import { authGuard, producerGuard, buyerGuard } from './services/auth-guard.service';

export const routes: Routes = [
  // Routes publiques
  {
    path: '',
    loadComponent: () => import('./components/home-page/home-page').then(m => m.HomePageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register').then(m => m.RegisterComponent)
  },

  // Routes protégées - Sélection de rôle
  {
    path: 'select-role',
    loadComponent: () => import('./components/role-selection/role-selection').then(m => m.RoleSelectionComponent),
    canActivate: [authGuard]
  },

  // ==================== ROUTES PRODUCTEUR ====================
  {
    path: 'producer/dashboard',
    loadComponent: () => import('./components/producer/dashboard/producer-dashboard').then(m => m.ProducerDashboardComponent),
    canActivate: [producerGuard]
  },
  {
    path: 'producer/add-product',
    loadComponent: () => import('./components/producer/add-product/add-product').then(m => m.AddProductComponent),
    canActivate: [producerGuard]
  },
  {
    path: 'producer/products',
    loadComponent: () => import('./components/producer/products/products').then(m => m.ProductsComponent),
    canActivate: [producerGuard]
  },
  {
    path: 'producer/sales',
    loadComponent: () => import('./components/producer/sales/sales').then(m => m.SalesComponent),
    canActivate: [producerGuard]
  },
  {
    path: 'producer/messages',
    loadComponent: () => import('./components/producer/messages/messages').then(m => m.MessagesComponent),
    canActivate: [producerGuard]
  },
  {
    path: 'producer/reputation',
    loadComponent: () => import('./components/producer/reputation/reputation').then(m => m.ReputationComponent),
    canActivate: [producerGuard]
  },

  // ==================== ROUTES ACHETEUR ====================
  {
    path: 'buyer/dashboard',
    loadComponent: () => import('./components/buyer/dashboard/buyer-dashboard').then(m => m.BuyerDashboardComponent),
    canActivate: [buyerGuard]
  },
  // Ajouter d'autres routes acheteur ici...

  { path: '**', redirectTo: '' }
];
