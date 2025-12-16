import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface DashboardStat {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  link?: string;
}

interface RecentPurchase {
  id: string;
  product: string;
  producer: string;
  date: string;
  amount: number;
  status: 'delivered' | 'shipping' | 'pending';
  certified: boolean;
}

interface RecommendedProduct {
  id: string;
  name: string;
  producer: string;
  price: number;
  rating: number;
  image: string;
  certified: boolean;
}

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './buyer-dashboard.html',
  styleUrls: ['./buyer-dashboard.css']
})
export class BuyerDashboardComponent implements OnInit {
  userData: any;
  stats: DashboardStat[] = [];
  recentPurchases: RecentPurchase[] = [];
  recommendedProducts: RecommendedProduct[] = [];
  categories = [
    { name: 'Légumes', icon: '🥦', count: 45 },
    { name: 'Fruits', icon: '🍎', count: 32 },
    { name: 'Céréales', icon: '🌾', count: 28 },
    { name: 'Épicerie', icon: '🛒', count: 15 }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Données simulées
    this.stats = [
      { label: 'Achats ce mois', value: 6, icon: '🛍️', color: '#2196F3', link: '/buyer/purchases' },
      { label: 'Dépenses totales', value: '75,000', icon: '💰', color: '#4CAF50' },
      { label: 'Certifications vérifiées', value: 8, icon: '✅', color: '#FF9800', link: '/buyer/verifications' },
      { label: 'Vendeurs favoris', value: 3, icon: '❤️', color: '#E91E63', link: '/buyer/favorites' },
      { label: 'Messages', value: 5, icon: '✉️', color: '#9C27B0', link: '/buyer/messages' },
      { label: 'Panier', value: 2, icon: '🛒', color: '#FF5722', link: '/buyer/cart' }
    ];

    this.recentPurchases = [
      { id: '001', product: 'Tomates Bio', producer: 'Alioune Farms', date: '2024-01-15', amount: 5000, status: 'delivered', certified: true },
      { id: '002', product: 'Oignons Rouges', producer: 'Fatou Market', date: '2024-01-14', amount: 3000, status: 'delivered', certified: false },
      { id: '003', product: 'Riz Local', producer: 'Sénégal Riz', date: '2024-01-13', amount: 12000, status: 'shipping', certified: true },
      { id: '004', product: 'Mangues', producer: 'Tropical Fruits', date: '2024-01-12', amount: 8000, status: 'pending', certified: true }
    ];

    this.recommendedProducts = [
      { id: '001', name: 'Tomates Bio', producer: 'Alioune Farms', price: 1500, rating: 4.8, image: '🍅', certified: true },
      { id: '002', name: 'Carottes Fraîches', producer: 'Bio Garden', price: 1200, rating: 4.5, image: '🥕', certified: true },
      { id: '003', name: 'Aubergines', producer: 'Market Fresh', price: 800, rating: 4.2, image: '🍆', certified: false },
      { id: '004', name: 'Pommes de Terre', producer: 'Root Vegetables', price: 1000, rating: 4.6, image: '🥔', certified: true }
    ];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'shipping': return '#2196F3';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'shipping': return 'En cours';
      case 'pending': return 'En attente';
      default: return status;
    }
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('marché') || lowerCommand.includes('jënd')) {
      window.location.href = '/buyer/market';
    } else if (lowerCommand.includes('scanner') || lowerCommand.includes('qr')) {
      window.location.href = '/buyer/scan';
    } else if (lowerCommand.includes('panier') || lowerCommand.includes('cart')) {
      window.location.href = '/buyer/cart';
    } else if (lowerCommand.includes('historique')) {
      window.location.href = '/buyer/purchases';
    }
  }


  formatPrice(price: number): string {
    return price.toLocaleString() + ' FCFA';
  }
}
