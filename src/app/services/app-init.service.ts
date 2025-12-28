import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(private firebaseService: FirebaseService) {}

  init(): Promise<void> {
    return new Promise((resolve) => {

      // Vérifier périodiquement l'état de Firebase
      let attempts = 0;
      const maxAttempts = 200; // 20 secondes max

      const checkAuthState = () => {
        attempts++;

        const firebaseUser = this.firebaseService.getCurrentAuthUser();
        const isLoading = this.firebaseService.isLoading;
        const hasUserData = !!this.firebaseService.userData;



        // 3. OU on a dépassé le nombre maximum de tentatives
        if (!isLoading || hasUserData || attempts >= maxAttempts) {

          resolve();
        } else {
          setTimeout(checkAuthState, 100);
        }
      };

      checkAuthState();
    });
  }
}
