import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(private firebaseService: FirebaseService) {}

  init(): Promise<void> {
    return new Promise((resolve) => {
      console.log('AppInitService - Début de l\'initialisation');

      // Vérifier périodiquement l'état de Firebase
      let attempts = 0;
      const maxAttempts = 200; // 10 secondes max

      const checkAuthState = () => {
        attempts++;

        const firebaseUser = this.firebaseService.getCurrentAuthUser();
        const isLoading = this.firebaseService.isLoading;

        console.log(`AppInitService - Tentative ${attempts}:`, {
          firebaseUser: firebaseUser?.email,
          isLoading,
          hasUserData: !!this.firebaseService.userData
        });

        // Condition de réussite :
        // 1. Firebase a terminé son chargement
        // 2. ET on a un utilisateur OU on sait qu'il n'y en a pas
        if (!isLoading || attempts >= maxAttempts) {
          console.log('AppInitService - Initialisation terminée:', {
            firebaseUser: firebaseUser?.email,
            userData: this.firebaseService.userData
          });
          resolve();
        } else {
          setTimeout(checkAuthState, 100);
        }
      };

      checkAuthState();
    });
  }
}
