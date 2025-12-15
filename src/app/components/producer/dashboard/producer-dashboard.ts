import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface DashboardStat {
  label: string;
  value: number;
  icon: string;
  color: string;
  link?: string;
}

interface RecentSale {
  id: string;
  product: string;
  buyer: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-producer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producer-dashboard.html',
  styleUrls: ['./producer-dashboard.css'],
})
export class ProducerDashboardComponent implements OnInit {
  userData: any;
  stats: DashboardStat[] = [];
  recentSales: RecentSale[] = [];
  notifications: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();
    this.loadDashboardData();
    this.loadNotifications();
  }

  loadDashboardData() {
    // Données simulées - à remplacer par Firestore plus tard
    this.stats = [
      {
        label: 'Produits en vente',
        value: 12,
        icon: '📦',
        color: '#4CAF50',
        link: '/producer/products',
      },
      {
        label: 'Ventes du mois',
        value: 8,
        icon: '💰',
        color: '#2196F3',
        link: '/producer/sales',
      },
      { label: 'Revenus total', value: 125000, icon: '💳', color: '#FF9800' },
      { label: 'Note moyenne', value: 4.5, icon: '⭐', color: '#FFC107' },
      {
        label: 'Certifications',
        value: 5,
        icon: '🔒',
        color: '#9C27B0',
        link: '/producer/certifications',
      },
      {
        label: 'Messages non lus',
        value: 3,
        icon: '✉️',
        color: '#E91E63',
        link: '/producer/messages',
      },
    ];

    this.recentSales = [
      {
        id: '001',
        product: 'Tomates Bio',
        buyer: 'Alioune Diop',
        date: '2024-01-15',
        amount: 15000,
        status: 'completed',
      },
      {
        id: '002',
        product: 'Oignons',
        buyer: 'Fatou Ndiaye',
        date: '2024-01-14',
        amount: 8000,
        status: 'completed',
      },
      {
        id: '003',
        product: 'Carottes',
        buyer: 'Moussa Fall',
        date: '2024-01-13',
        amount: 12000,
        status: 'pending',
      },
      {
        id: '004',
        product: 'Pommes de terre',
        buyer: 'Aminata Sow',
        date: '2024-01-12',
        amount: 10000,
        status: 'completed',
      },
      {
        id: '005',
        product: 'Aubergines',
        buyer: 'Ibrahima Diallo',
        date: '2024-01-11',
        amount: 7000,
        status: 'cancelled',
      },
    ];
  }

  loadNotifications() {
    this.notifications = [
      {
        id: 1,
        title: 'Nouvelle commande',
        message: 'Vous avez reçu une commande de Tomates',
        time: 'Il y a 2h',
        read: false,
      },
      {
        id: 2,
        title: 'Certification approuvée',
        message: 'Votre certification "Tomates Bio" a été approuvée',
        time: 'Il y a 1 jour',
        read: true,
      },
      {
        id: 3,
        title: 'Avis reçu',
        message: 'Alioune Diop a donné 5 étoiles à vos Tomates',
        time: 'Il y a 2 jours',
        read: true,
      },
      {
        id: 4,
        title: 'Rappel de stock',
        message: 'Votre stock de Carottes est faible',
        time: 'Il y a 3 jours',
        read: false,
      },
    ];
  }

  markAsRead(notificationId: number) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('ajouter') || lowerCommand.includes('yokk')) {
      // Navigation vers ajouter produit
      window.location.href = '/producer/add-product';
    } else if (
      lowerCommand.includes('produits') ||
      lowerCommand.includes('féetël')
    ) {
      // Navigation vers mes produits
      window.location.href = '/producer/products';
    } else if (
      lowerCommand.includes('ventes') ||
      lowerCommand.includes('vente')
    ) {
      // Navigation vers ventes
      window.location.href = '/producer/sales';
    } else if (
      lowerCommand.includes('certifier') ||
      lowerCommand.includes('certification')
    ) {
      // Navigation vers certifications
      window.location.href = '/producer/certifications';
    }
  }
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

}
