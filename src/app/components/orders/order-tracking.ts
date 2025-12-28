// components/orders/order-tracking/order-tracking.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../services/data.interfaces';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrls: ['./order-tracking.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OrderTrackingComponent implements OnInit {
  // Données
  orders: Sale[] = [];
  filteredOrders: Sale[] = [];
  selectedOrder: Sale | null = null;
  isLoading = false;

  // Rôle de l'utilisateur
  userRole: 'buyer' | 'producer' | null = null;

  // Filtres
  searchTerm = '';
  statusFilter: Sale['status'] | 'all' = 'all';
  dateFilter = 'all';
  activeTab: 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' = 'all';

  // Statistiques
  stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };

  // Options de filtre
  statusOptions = [
    { id: 'all', name: 'Tous les statuts' },
    { id: 'pending', name: 'En attente' },
    { id: 'confirmed', name: 'Confirmé' },
    { id: 'shipped', name: 'Expédié' },
    { id: 'delivered', name: 'Livré' },
    { id: 'completed', name: 'Terminé' },
    { id: 'cancelled', name: 'Annulé' }
  ];

  dateOptions = [
    { id: 'all', name: 'Toute période' },
    { id: 'today', name: "Aujourd'hui" },
    { id: 'week', name: 'Cette semaine' },
    { id: 'month', name: 'Ce mois' }
  ];

  constructor(
    private firebaseService: FirebaseService,
    private salesService: SalesService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    // Vérifier l'authentification et le rôle
    const user = this.firebaseService.userData;
    if (!user) {
      console.error('Utilisateur non connecté');
      this.isLoading = false;
      return;
    }

    this.userRole = user.role;

    await this.loadOrders();

    // Vérifier si un ID de commande est passé dans l'URL
    this.route.params.subscribe(params => {
      if (params['orderId']) {
        this.showOrderDetails(params['orderId']);
      }
    });

    this.isLoading = false;
  }

  async loadOrders() {
    try {
      const user = this.firebaseService.userData;
      if (!user || !this.userRole) return;

      // Charger les commandes selon le rôle
      if (this.userRole === 'buyer') {
        this.orders = await this.salesService.getBuyerOrders(user.uid);
      } else if (this.userRole === 'producer') {
        this.orders = await this.salesService.getSales(user.uid);
      }

      // Calculer les statistiques
      this.calculateStats();

      // Appliquer les filtres par défaut
      this.applyFilters();

    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      this.showNotification('Erreur de chargement des commandes', 'error');
    }
  }

  calculateStats() {
    this.stats = {
      total: this.orders.length,
      pending: this.orders.filter(o => o.status === 'pending').length,
      confirmed: this.orders.filter(o => o.status === 'confirmed').length,
      shipped: this.orders.filter(o => o.status === 'shipped').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length,
      completed: this.orders.filter(o => o.status === 'completed').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: this.orders.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: this.orders.length > 0
        ? this.orders.reduce((sum, o) => sum + o.totalAmount, 0) / this.orders.length
        : 0
    };
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.productName.toLowerCase().includes(searchLower) ||
        (this.isBuyer ? order.producerName : order.buyerName).toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut
    if (this.statusFilter && this.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    // Filtre par date
    if (this.dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);

        switch (this.dateFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    this.filteredOrders = filtered;
  }

  // Navigation par onglets
  setActiveTab(tab: 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed') {
    this.activeTab = tab;
    this.statusFilter = tab === 'all' ? 'all' : tab;
    this.applyFilters();
  }

  // Afficher les détails d'une commande
  async showOrderDetails(orderId: string) {
    this.selectedOrder = this.orders.find(o => o.id === orderId) || null;
  }

  closeOrderDetails() {
    this.selectedOrder = null;
  }

  // Mettre à jour le statut d'une commande (SEULEMENT pour producteur)
  async updateOrderStatus(orderId: string, newStatus: Sale['status']) {
    if (!newStatus || !this.isProducer) return;

    try {
      const result = await this.salesService.updateSaleStatus(orderId, newStatus);

      if (result.success) {
        await this.loadOrders(); // Recharger les données
        this.showNotification(`Statut mis à jour: ${this.salesService.getStatusText(newStatus)}`, 'success');
      } else {
        this.showNotification(`Erreur: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      this.showNotification('Erreur lors de la mise à jour', 'error');
    }
  }

  // ==================== UTILITAIRES POUR LE TEMPLATE ====================

  get isBuyer(): boolean {
    return this.userRole === 'buyer';
  }

  get isProducer(): boolean {
    return this.userRole === 'producer';
  }

  getStatusIcon(status: Sale['status']): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
      case 'completed': return '⭐';
      case 'cancelled': return '❌';
      case 'refunded': return '💸';
      default: return '📋';
    }
  }

  getStatusBadgeClass(status: Sale['status']): string {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'shipped': return 'badge-shipped';
      case 'delivered': return 'badge-delivered';
      case 'completed': return 'badge-completed';
      case 'cancelled': return 'badge-cancelled';
      case 'refunded': return 'badge-refunded';
      default: return 'badge-default';
    }
  }

  formatDate(date: Date): string {
    return this.salesService.formatDate(date);
  }

  formatPrice(price: number): string {
    return this.salesService.formatPrice(price);
  }

  getStatusText(status: Sale['status']): string {
    return this.salesService.getStatusText(status);
  }

  getPaymentMethodText(method: Sale['paymentMethod']): string {
    return this.salesService.getPaymentMethodText(method);
  }

  getDeliveryTypeText(type: Sale['deliveryType']): string {
    return this.salesService.getDeliveryTypeText(type);
  }

  // Vérifier l'étape de la timeline
  isTimelineStepActive(order: Sale, step: number): boolean {
    const steps = ['pending', 'confirmed', 'shipped', 'delivered', 'completed'];
    const currentStepIndex = steps.indexOf(order.status);
    return currentStepIndex >= step;
  }

  // Calculer la progression en pourcentage
  getOrderProgress(order: Sale): number {
    const steps = ['pending', 'confirmed', 'shipped', 'delivered', 'completed'];
    const currentStepIndex = steps.indexOf(order.status);
    return (currentStepIndex + 1) / steps.length * 100;
  }

  // Réinitialiser les filtres
  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.dateFilter = 'all';
    this.activeTab = 'all';
    this.applyFilters();
  }

  // Obtenir le titre selon le rôle
  getPageTitle(): string {
    if (this.isBuyer) return '📦 Mes Commandes';
    if (this.isProducer) return '💰 Commandes Clients';
    return '📋 Commandes';
  }

  getPageSubtitle(): string {
    if (this.isBuyer) return 'Suivez l\'état de vos commandes en temps réel';
    if (this.isProducer) return 'Gérez et suivez vos commandes clients';
    return 'Suivi des commandes';
  }

  // Notifications
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode === document.body) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }
}
