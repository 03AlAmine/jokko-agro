import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private authReadySubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<any>(null);

  authReady$: Observable<boolean> = this.authReadySubject.asObservable();
  user$: Observable<any> = this.userSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.setupAuthListener();
  }

  private setupAuthListener() {
    // S'abonner aux changements de Firebase
    // Note: Vous devrez peut-être modifier FirebaseService pour exposer un Observable
    // Pour une solution rapide, utilisez un polling
    this.checkAuthState();

    // Vérifier l'état toutes les 100ms pendant 10 secondes
    let attempts = 0;
    const maxAttempts = 100;

    const interval = setInterval(() => {
      attempts++;
      this.checkAuthState();

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        this.authReadySubject.next(true);
      }
    }, 100);
  }

  private checkAuthState() {
    const firebaseUser = this.firebaseService.getCurrentAuthUser();
    const userData = this.firebaseService.userData;

    if (firebaseUser || this.firebaseService.isLoading === false) {
      this.userSubject.next({
        firebaseUser,
        userData
      });
      this.authReadySubject.next(true);
    }
  }

  waitForAuthReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.authReadySubject.value) {
        resolve();
      } else {
        const subscription = this.authReady$.subscribe((ready) => {
          if (ready) {
            subscription.unsubscribe();
            resolve();
          }
        });
      }
    });
  }

  getCurrentUser() {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    const state = this.userSubject.value;
    return !!state?.firebaseUser;
  }
}
