import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService, UserData } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  constructor() {
    // Vérifier l'état de chargement au démarrage
    this.firebaseService.isLoading = false;
  }

  async register(userData: any) {
    const result = await this.firebaseService.register(userData);

    if (result.success) {
      this.router.navigate(['/select-role']);
    }

    return result;
  }

  async login(email: string, password: string) {
    const result = await this.firebaseService.login(email, password);

    if (result.success) {
      // Attendre que les données utilisateur soient chargées
      await this.waitForUserData();

      const role = this.firebaseService.getUserRole();
      if (role === 'producer') {
        this.router.navigate(['/producer/dashboard']);
      } else if (role === 'buyer') {
        this.router.navigate(['/buyer/dashboard']);
      } else {
        this.router.navigate(['/select-role']);
      }
    }

    return result;
  }

  async logout() {
    try {
      // Nettoyer le cache avant de déconnecter
      this.firebaseService.clearCache();

      await this.firebaseService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Rediriger quand même vers login en cas d'erreur
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    return this.firebaseService.isAuthenticated();
  }

  getUserRole(): 'producer' | 'buyer' | null {
    return this.firebaseService.getUserRole();
  }

  getCurrentUser() {
    return this.firebaseService.currentUser;
  }

  getUserData() {
    return this.firebaseService.userData;
  }

  async updateUserRole(role: 'producer' | 'buyer') {
    const user = this.firebaseService.currentUser;
    if (!user) throw new Error('Aucun utilisateur connecté');

    await this.firebaseService.updateUserRole(user.uid, role);
  }

  isInitializing(): boolean {
    return this.firebaseService.isLoading;
  }

  // Attendre que les données utilisateur soient chargées
  private async waitForUserData(): Promise<void> {
    return new Promise((resolve) => {
      const checkData = () => {
        if (this.firebaseService.userData !== null) {
          resolve();
        } else {
          setTimeout(checkData, 100);
        }
      };
      checkData();
    });
  }
}
