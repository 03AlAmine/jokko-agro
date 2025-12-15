import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface Sale {
  id: string;
  orderNumber: string;
  product: string;
  buyer: {
    name: string;
    phone: string;
    location: string;
  };
  date: Date;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'completed' | 'pending' | 'cancelled' | 'shipped';
  paymentMethod: 'wave' | 'orange_money' | 'free_money' | 'cash';
  deliveryType: 'pickup' | 'delivery';
  rating?: number;
  review?: string;
}

interface SalesStat {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

interface MonthlyStat {
  month: string;
  sales: number;
  revenue: number;
  orders: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css'],
})
export class SalesComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  isLoading = false;

  // Filtres
  selectedPeriod = 'all';
  selectedStatus = 'all';
  selectedPayment = 'all';
  searchQuery = '';

  periods = [
    { id: 'today', name: "Aujourd'hui" },
    { id: 'week', name: 'Cette semaine' },
    { id: 'month', name: 'Ce mois' },
    { id: 'quarter', name: 'Ce trimestre' },
    { id: 'year', name: 'Cette année' },
    { id: 'all', name: 'Toutes' },
  ];

  statuses = [
    { id: 'all', name: 'Tous les statuts' },
    { id: 'completed', name: 'Complété' },
    { id: 'pending', name: 'En attente' },
    { id: 'shipped', name: 'Expédié' },
    { id: 'cancelled', name: 'Annulé' },
  ];

  paymentMethods = [
    { id: 'all', name: 'Tous les paiements' },
    { id: 'wave', name: 'Wave' },
    { id: 'orange_money', name: 'Orange Money' },
    { id: 'free_money', name: 'Free Money' },
    { id: 'cash', name: 'Espèces' },
  ];

  // Statistiques
  stats: SalesStat[] = [];
  monthlyStats: MonthlyStat[] = [];

  // Top produits
  topProducts = [
    { name: 'Tomates Bio', sales: 45, revenue: 67500 },
    { name: 'Oignons Rouges', sales: 60, revenue: 48000 },
    { name: 'Carottes Fraîches', sales: 28, revenue: 33600 },
    { name: 'Mangues Kent', sales: 15, revenue: 30000 },
  ];

  // Données pour les graphiques (simplifié)
  revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenus (FCFA)',
        data: [450000, 520000, 480000, 610000, 700000, 850000],
        backgroundColor: 'rgba(46, 125, 50, 0.2)',
        borderColor: 'rgba(46, 125, 50, 1)',
        borderWidth: 2,
      },
    ],
  };

  salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Nombre de ventes',
        data: [45, 52, 48, 61, 70, 85],
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 2,
      },
    ],
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadSalesData();
    this.loadStats();
    this.generateMonthlyStats();
  }

  loadSalesData() {
    this.isLoading = true;

    // Données simulées
    this.sales = [
      {
        id: '1',
        orderNumber: 'CMD-2024-001',
        product: 'Tomates Bio (5kg)',
        buyer: {
          name: 'Alioune Diop',
          phone: '77 123 45 67',
          location: 'Dakar, Plateau',
        },
        date: new Date('2024-01-15'),
        quantity: 5,
        unitPrice: 1500,
        totalAmount: 7500,
        status: 'completed',
        paymentMethod: 'wave',
        deliveryType: 'pickup',
        rating: 5,
        review: 'Produits frais et de qualité, recommandé!',
      },
      {
        id: '2',
        orderNumber: 'CMD-2024-002',
        product: 'Carottes Fraîches (3kg)',
        buyer: {
          name: 'Fatou Ndiaye',
          phone: '78 234 56 78',
          location: 'Pikine',
        },
        date: new Date('2024-01-14'),
        quantity: 3,
        unitPrice: 1200,
        totalAmount: 3600,
        status: 'completed',
        paymentMethod: 'orange_money',
        deliveryType: 'delivery',
        rating: 4,
        review: 'Bon produit, livraison rapide',
      },
      {
        id: '3',
        orderNumber: 'CMD-2024-003',
        product: 'Oignons Rouges (10kg)',
        buyer: {
          name: 'Moussa Fall',
          phone: '76 345 67 89',
          location: 'Guediawaye',
        },
        date: new Date('2024-01-13'),
        quantity: 10,
        unitPrice: 800,
        totalAmount: 8000,
        status: 'shipped',
        paymentMethod: 'free_money',
        deliveryType: 'delivery',
      },
      {
        id: '4',
        orderNumber: 'CMD-2024-004',
        product: 'Mangues Kent (2kg)',
        buyer: {
          name: 'Aminata Sow',
          phone: '70 456 78 90',
          location: 'Mermoz',
        },
        date: new Date('2024-01-12'),
        quantity: 2,
        unitPrice: 2000,
        totalAmount: 4000,
        status: 'pending',
        paymentMethod: 'cash',
        deliveryType: 'pickup',
      },
      {
        id: '5',
        orderNumber: 'CMD-2024-005',
        product: 'Riz Local (1 sac)',
        buyer: {
          name: 'Ibrahima Diallo',
          phone: '77 567 89 01',
          location: 'Ouakam',
        },
        date: new Date('2024-01-11'),
        quantity: 1,
        unitPrice: 5000,
        totalAmount: 5000,
        status: 'cancelled',
        paymentMethod: 'wave',
        deliveryType: 'pickup',
      },
      {
        id: '6',
        orderNumber: 'CMD-2024-006',
        product: 'Tomates Bio (3kg)',
        buyer: {
          name: 'Khadija Gueye',
          phone: '78 678 90 12',
          location: 'Liberté 6',
        },
        date: new Date('2024-01-10'),
        quantity: 3,
        unitPrice: 1500,
        totalAmount: 4500,
        status: 'completed',
        paymentMethod: 'orange_money',
        deliveryType: 'delivery',
        rating: 5,
      },
    ];

    this.filteredSales = [...this.sales];
    this.isLoading = false;
  }

  loadStats() {
    this.stats = [
      {
        label: 'Revenu total',
        value: 125000,
        change: 15,
        trend: 'up',
        icon: '💰',
        color: '#4CAF50',
      },
      {
        label: 'Ventes totales',
        value: 8,
        change: 20,
        trend: 'up',
        icon: '📈',
        color: '#2196F3',
      },
      {
        label: 'Panier moyen',
        value: 6250,
        change: 5,
        trend: 'up',
        icon: '🛒',
        color: '#FF9800',
      },
      {
        label: 'Taux de complétion',
        value: 85,
        change: -2,
        trend: 'down',
        icon: '✅',
        color: '#9C27B0',
      },
      {
        label: 'Clients actifs',
        value: 6,
        change: 10,
        trend: 'up',
        icon: '👥',
        color: '#E91E63',
      },
      {
        label: 'Note moyenne',
        value: 4.7,
        change: 0.3,
        trend: 'up',
        icon: '⭐',
        color: '#FFC107',
      },
    ];
  }

  generateMonthlyStats() {
    this.monthlyStats = [
      { month: 'Jan', sales: 45, revenue: 450000, orders: 8 },
      { month: 'Feb', sales: 52, revenue: 520000, orders: 10 },
      { month: 'Mar', sales: 48, revenue: 480000, orders: 9 },
      { month: 'Apr', sales: 61, revenue: 610000, orders: 12 },
      { month: 'May', sales: 70, revenue: 700000, orders: 14 },
      { month: 'Jun', sales: 85, revenue: 850000, orders: 17 },
    ];
  }

  applyFilters() {
    let filtered = [...this.sales];

    // Filtre par recherche
    if (this.searchQuery) {
      filtered = filtered.filter(
        (sale) =>
          sale.orderNumber
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          sale.product.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          sale.buyer.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Filtre par statut
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((sale) => sale.status === this.selectedStatus);
    }

    // Filtre par méthode de paiement
    if (this.selectedPayment !== 'all') {
      filtered = filtered.filter(
        (sale) => sale.paymentMethod === this.selectedPayment
      );
    }

    // Filtre par période
    if (this.selectedPeriod !== 'all') {
      const now = new Date();
      const startDate = this.getPeriodStartDate(this.selectedPeriod);

      filtered = filtered.filter(
        (sale) => sale.date >= startDate && sale.date <= now
      );
    }

    // Tri par date récente d'abord
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    this.filteredSales = filtered;
  }

  getPeriodStartDate(period: string): Date {
    const now = new Date();
    const start = new Date(now);

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return new Date(0); // Toutes les dates
    }

    return start;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'shipped':
        return 'Expédié';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'shipped':
        return 'status-shipped';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'wave':
        return 'Wave';
      case 'orange_money':
        return 'Orange Money';
      case 'free_money':
        return 'Free Money';
      case 'cash':
        return 'Espèces';
      default:
        return method;
    }
  }

  getDeliveryTypeText(type: string): string {
    return type === 'pickup' ? 'À retirer' : 'Livraison';
  }

  getTotalRevenue(): number {
    return this.sales
      .filter((s) => s.status === 'completed')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }

  getAverageRating(): number {
    const ratedSales = this.sales.filter((s) => s.rating);
    if (ratedSales.length === 0) return 0;

    const total = ratedSales.reduce((sum, sale) => sum + (sale.rating || 0), 0);
    return Math.round((total / ratedSales.length) * 10) / 10;
  }

  getCompletionRate(): number {
    const completed = this.sales.filter((s) => s.status === 'completed').length;
    return Math.round((completed / this.sales.length) * 100);
  }

  viewSaleDetails(sale: Sale) {
    console.log('Voir détails:', sale);
    // À implémenter: modal ou page de détails
  }

  updateSaleStatus(saleId: string, newStatus: string) {
    const sale = this.sales.find((s) => s.id === saleId);
    if (sale) {
      sale.status = newStatus as any;
      this.applyFilters();
      // À implémenter: mise à jour dans Firestore
    }
  }
  clearFilters() {
    // Réinitialiser les filtres
    this.selectedPeriod = 'all';
    this.selectedStatus = 'all';
    this.selectedPayment = 'all';
    this.searchQuery = '';

    // Réappliquer les filtres (affiche toutes les ventes)
    this.applyFilters();
  }
  getTotalFilteredRevenue(): string {
    const total = this.filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    return total.toLocaleString();
  }

  exportSales() {
    console.log('Exporter les ventes');
    // À implémenter: export CSV/Excel
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('revenu') || lowerCommand.includes('argent')) {
      alert(`Revenu total: ${this.getTotalRevenue().toLocaleString()} FCFA`);
    } else if (
      lowerCommand.includes('note') ||
      lowerCommand.includes('rating')
    ) {
      alert(`Note moyenne: ${this.getAverageRating()}/5`);
    } else if (
      lowerCommand.includes('exporter') ||
      lowerCommand.includes('télécharger')
    ) {
      this.exportSales();
    }
  }
}
