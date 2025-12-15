import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Vérifier si l'application est toujours en cours d'initialisation
    if (this.authService.isInitializing()) {
      console.log('Application en cours d\'initialisation...');
      return false;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}

// Guards functions
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'application est toujours en cours d'initialisation
  if (authService.isInitializing()) {
    console.log('Application en cours d\'initialisation...');
    return false;
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const producerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitializing()) {
    console.log('Application en cours d\'initialisation...');
    return false;
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.getUserRole() !== 'producer') {
    router.navigate(['/buyer/dashboard']);
    return false;
  }

  return true;
};

export const buyerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitializing()) {
    console.log('Application en cours d\'initialisation...');
    return false;
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.getUserRole() !== 'buyer') {
    router.navigate(['/producer/dashboard']);
    return false;
  }

  return true;
};
