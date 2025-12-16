import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

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
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() config!: SidebarConfig;
  @Input() isCollapsed = false;
  @Output() logout = new EventEmitter<void>();

  userData: any;
  cartItemCount = 0;
  private cartSubscription?: Subscription;

  // Configurations par défaut
  producerConfig: SidebarConfig = {
    type: 'producer',
    items: [
      { label: 'Tableau de bord', icon: '📊', route: '/producer/dashboard' },
      { label: 'Ajouter un produit', icon: '➕', route: '/producer/add-product' },
      { label: 'Mes produits', icon: '📦', route: '/producer/products' },
      { label: 'Certifications', icon: '🔒', route: '/producer/certifications' },
      { label: 'Ventes', icon: '💰', route: '/producer/sales' },
      { label: 'Messages', icon: '✉️', route: '/producer/messages', badge: 3 },
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
      { label: 'Messages', icon: '✉️', route: '/buyer/messages', badge: 2 },
      { label: 'Favoris', icon: '❤️', route: '/buyer/favorites', badge: 5 },
      { label: 'Paramètres', icon: '⚙️', route: '/buyer/settings' }
    ]
  };

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();

    // Si aucune config n'est fournie, utiliser celle par défaut selon le rôle
    if (!this.config) {
      const role = this.authService.getUserRole();
      this.config = role === 'producer' ? this.producerConfig : this.buyerConfig;
    }

    // Initialiser le compteur du panier
    this.updateCartCount();

    // Surveiller les changements dans le panier
    this.setupCartMonitoring();
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  private setupCartMonitoring() {
    // Mettre à jour le compteur quand le panier change
    // Note: Dans l'implémentation actuelle, nous devons utiliser un intervalle
    // car CartService n'a pas d'Observable. Une meilleure solution serait d'ajouter
    // un BehaviorSubject dans CartService.
    setInterval(() => {
      this.updateCartCount();
    }, 1000); // Vérifier chaque seconde

    // Mettre à jour aussi quand la fenêtre redevient active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateCartCount();
      }
    });
  }

  private updateCartCount() {
    const cartItems = this.cartService.getCartItems();
    this.cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // Mettre à jour le badge du panier dans la sidebar
    this.updateCartBadge();
  }

  private updateCartBadge() {
    const cartItem = this.config.items.find(item => item.label === 'Panier' || item.route === '/buyer/cart');
    if (cartItem) {
      cartItem.badge = this.cartItemCount > 0 ? this.cartItemCount : undefined;
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

  // Méthode pour obtenir le badge d'un item
  getItemBadge(item: SidebarItem): number | undefined {
    if (item.label === 'Panier' || item.route === '/buyer/cart') {
      return this.cartItemCount > 0 ? this.cartItemCount : undefined;
    }
    return item.badge;
  }
}
