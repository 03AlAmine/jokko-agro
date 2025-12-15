import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent, SidebarConfig } from './shared/sidebar/sidebar';
import { VoiceAssistantComponent } from './components/voice-assistant/voice-assistant';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, VoiceAssistantComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  showSidebar = false;
  showVoiceAssistant = false;
  isCollapsed = false;
  sidebarConfig: SidebarConfig | null = null;
  isLoading = true;

  private noSidebarRoutes = ['/', '/login', '/register'];
  private noVoiceAssistantRoutes = ['/login', '/register'];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateUIState(event.url);
    });
  }

  async ngOnInit() {
    // Attendre l'initialisation complète
    await this.waitForInitialization();
    this.updateUIState(this.router.url);
  }

  private async waitForInitialization(): Promise<void> {
    // Attendre que l'authentification soit initialisée
    return new Promise((resolve) => {
      const checkInitialization = () => {
        if (!this.authService.isInitializing()) {
          this.isLoading = false;
          resolve();
        } else {
          setTimeout(checkInitialization, 100);
        }
      };
      checkInitialization();
    });
  }

  private updateUIState(url: string) {
    // Mettre à jour le chargement
    this.isLoading = this.authService.isInitializing();

    // Déterminer si on doit montrer le sidebar
    this.showSidebar = !this.noSidebarRoutes.some(route => url === route || url.startsWith(route + '/'));

    // Déterminer si on doit montrer l'assistant vocal
    this.showVoiceAssistant = !this.noVoiceAssistantRoutes.some(route => url === route || url.startsWith(route + '/'));

    // Configurer le sidebar si nécessaire
    if (this.showSidebar && !this.isLoading) {
      this.setupSidebarConfig();
    }
  }

  private setupSidebarConfig() {
    const role = this.authService.getUserRole();

    if (role === 'producer') {
      this.sidebarConfig = {
        type: 'producer',
        items: [
          { label: 'Tableau de bord', icon: '📊', route: '/producer/dashboard' },
          { label: 'Ajouter un produit', icon: '➕', route: '/producer/add-product' },
          { label: 'Mes produits', icon: '📦', route: '/producer/products' },
          { label: 'Certifications', icon: '🔒', route: '/producer/certifications' },
          { label: 'Ventes', icon: '💰', route: '/producer/sales' },
          { label: 'Messages', icon: '✉️', route: '/producer/messages' },
          { label: 'Réputation', icon: '⭐', route: '/producer/reputation' },
          { label: 'Paramètres', icon: '⚙️', route: '/producer/settings' }
        ]
      };
    } else if (role === 'buyer') {
      this.sidebarConfig = {
        type: 'buyer',
        items: [
          { label: 'Tableau de bord', icon: '📊', route: '/buyer/dashboard' },
          { label: 'Marché', icon: '🛍️', route: '/buyer/market' },
          { label: 'Scanner QR', icon: '📱', route: '/buyer/scan' },
          { label: 'Panier', icon: '🛒', route: '/buyer/cart' },
          { label: 'Historique', icon: '📋', route: '/buyer/purchases' },
          { label: 'Vérifications', icon: '✅', route: '/buyer/verifications' },
          { label: 'Messages', icon: '✉️', route: '/buyer/messages' },
          { label: 'Favoris', icon: '❤️', route: '/buyer/favorites' },
          { label: 'Paramètres', icon: '⚙️', route: '/buyer/settings' }
        ]
      };
    } else {
      this.sidebarConfig = null;
    }
  }

  onLogout() {
    this.authService.logout();
  }
}
