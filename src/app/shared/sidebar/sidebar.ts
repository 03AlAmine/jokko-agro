import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  disabled?: boolean;
}

export interface SidebarConfig {
  type: 'producer' | 'buyer';
  items: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  @Input() config!: SidebarConfig;
  @Input() isCollapsed = false;
  @Output() logout = new EventEmitter<void>();

  userData: any;

  // Configurations par défaut
  producerConfig: SidebarConfig = {
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

  buyerConfig: SidebarConfig = {
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

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();

    // Si aucune config n'est fournie, utiliser celle par défaut selon le rôle
    if (!this.config) {
      const role = this.authService.getUserRole();
      this.config = role === 'producer' ? this.producerConfig : this.buyerConfig;
    }
  }

  getRoleLabel(): string {
    return this.config.type === 'producer' ? '👨‍🌾 Producteur' : '🛒 Acheteur';
  }

  getRoleColor(): string {
    return this.config.type === 'producer' ? '#2e7d32' : '#1976d2';
  }

  getInitials(): string {
    if (!this.userData?.fullName) return 'U';
    return this.userData.fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onLogout() {
    this.logout.emit();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
