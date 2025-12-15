import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface Review {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  product: string;
  rating: number;
  comment: string;
  date: Date;
  verifiedPurchase: boolean;
  helpful: number;
  response?: {
    content: string;
    date: Date;
  };
}

interface RatingStat {
  stars: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-reputation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reputation.html',
  styleUrls: ['./reputation.css']
})
export class ReputationComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  stats = {
    averageRating: 4.7,
    totalReviews: 24,
    fiveStar: 16,
    fourStar: 5,
    threeStar: 2,
    twoStar: 1,
    oneStar: 0,
    responseRate: 85,
    helpfulRate: 92
  };

  ratingStats: RatingStat[] = [];

  // Filtres
  selectedRating = 'all';
  selectedSort = 'recent';
  searchQuery = '';

  ratingOptions = [
    { id: 'all', name: 'Toutes les notes' },
    { id: '5', name: '5 étoiles' },
    { id: '4', name: '4 étoiles' },
    { id: '3', name: '3 étoiles' },
    { id: '2', name: '2 étoiles' },
    { id: '1', name: '1 étoile' }
  ];

  sortOptions = [
    { id: 'recent', name: 'Plus récent' },
    { id: 'helpful', name: 'Plus utile' },
    { id: 'rating_high', name: 'Meilleures notes' },
    { id: 'rating_low', name: 'Notes les plus basses' }
  ];
Math: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadReviews();
    this.calculateRatingStats();
  }

  loadReviews() {
    // Données simulées
    this.reviews = [
      {
        id: '1',
        buyerId: '1',
        buyerName: 'Alioune Diop',
        buyerAvatar: '👨🏾',
        product: 'Tomates Bio',
        rating: 5,
        comment: 'Produits frais et de qualité, exactement comme sur la photo. Le producteur est très professionnel et la livraison a été rapide. Je recommande vivement !',
        date: new Date('2024-01-15'),
        verifiedPurchase: true,
        helpful: 12,
        response: {
          content: 'Merci Alioune pour votre confiance ! Ravis que nos tomates vous aient plu. Au plaisir de vous revoir bientôt.',
          date: new Date('2024-01-15')
        }
      },
      {
        id: '2',
        buyerId: '2',
        buyerName: 'Fatou Ndiaye',
        buyerAvatar: '👩🏾',
        product: 'Carottes Fraîches',
        rating: 4,
        comment: 'Bon produit, livraison rapide. Les carottes étaient fraîches mais certaines étaient un peu petites.',
        date: new Date('2024-01-14'),
        verifiedPurchase: true,
        helpful: 8
      },
      {
        id: '3',
        buyerId: '3',
        buyerName: 'Moussa Fall',
        buyerAvatar: '👨🏾',
        product: 'Oignons Rouges',
        rating: 3,
        comment: 'Les oignons étaient corrects mais le prix est un peu élevé par rapport au marché. Livraison un peu lente.',
        date: new Date('2024-01-13'),
        verifiedPurchase: true,
        helpful: 5
      },
      {
        id: '4',
        buyerId: '4',
        buyerName: 'Aminata Sow',
        buyerAvatar: '👩🏾',
        product: 'Mangues Kent',
        rating: 5,
        comment: 'Des mangues délicieuses et bien mûres ! Le producteur a même ajouté quelques fruits en cadeau. Très bonne expérience.',
        date: new Date('2024-01-12'),
        verifiedPurchase: true,
        helpful: 15
      },
      {
        id: '5',
        buyerId: '5',
        buyerName: 'Ibrahima Diallo',
        buyerAvatar: '👨🏾',
        product: 'Riz Local',
        rating: 2,
        comment: 'Le riz était bon mais l\'emballage était endommagé à l\'arrivée. Dommage car le produit en lui-même est de qualité.',
        date: new Date('2024-01-11'),
        verifiedPurchase: true,
        helpful: 3,
        response: {
          content: 'Nous sommes désolés pour l\'emballage endommagé. Nous avons contacté notre service de livraison pour améliorer ce point. Merci pour votre retour qui nous aide à nous améliorer.',
          date: new Date('2024-01-11')
        }
      },
      {
        id: '6',
        buyerId: '6',
        buyerName: 'Khadija Gueye',
        buyerAvatar: '👩🏾',
        product: 'Tomates Bio',
        rating: 5,
        comment: 'Excellentes tomates, très goûteuses ! Je suis une cliente fidèle maintenant.',
        date: new Date('2024-01-10'),
        verifiedPurchase: true,
        helpful: 10
      }
    ];

    this.filteredReviews = [...this.reviews];
    this.applyFilters();
  }

  calculateRatingStats() {
    this.ratingStats = [
      { stars: 5, count: this.stats.fiveStar, percentage: (this.stats.fiveStar / this.stats.totalReviews) * 100 },
      { stars: 4, count: this.stats.fourStar, percentage: (this.stats.fourStar / this.stats.totalReviews) * 100 },
      { stars: 3, count: this.stats.threeStar, percentage: (this.stats.threeStar / this.stats.totalReviews) * 100 },
      { stars: 2, count: this.stats.twoStar, percentage: (this.stats.twoStar / this.stats.totalReviews) * 100 },
      { stars: 1, count: this.stats.oneStar, percentage: (this.stats.oneStar / this.stats.totalReviews) * 100 }
    ];
  }

  applyFilters() {
    let filtered = [...this.reviews];

    // Filtre par note
    if (this.selectedRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(this.selectedRating));
    }

    // Filtre par recherche
    if (this.searchQuery) {
      filtered = filtered.filter(review =>
        review.buyerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        review.product.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (this.selectedSort) {
        case 'recent':
          return b.date.getTime() - a.date.getTime();
        case 'helpful':
          return b.helpful - a.helpful;
        case 'rating_high':
          return b.rating - a.rating;
        case 'rating_low':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    this.filteredReviews = filtered;
  }

  markAsHelpful(reviewId: string) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.helpful++;
      this.applyFilters();
    }
  }

  addResponse(reviewId: string) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review && !review.response) {
      const response = prompt('Votre réponse à cet avis :');
      if (response && response.trim()) {
        review.response = {
          content: response.trim(),
          date: new Date()
        };
        this.applyFilters();
      }
    }
  }

  editResponse(reviewId: string) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review?.response) {
      const newResponse = prompt('Modifier votre réponse :', review.response.content);
      if (newResponse && newResponse.trim()) {
        review.response.content = newResponse.trim();
        review.response.date = new Date();
        this.applyFilters();
      }
    }
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  }

  getOverallRatingPercentage(): number {
    return (this.stats.averageRating / 5) * 100;
  }

  getResponseRatePercentage(): number {
    const respondedReviews = this.reviews.filter(r => r.response).length;
    return (respondedReviews / this.reviews.length) * 100;
  }

  getReputationLevel(): string {
    if (this.stats.averageRating >= 4.5) return 'Excellente';
    if (this.stats.averageRating >= 4.0) return 'Très bonne';
    if (this.stats.averageRating >= 3.5) return 'Bonne';
    if (this.stats.averageRating >= 3.0) return 'Moyenne';
    return 'À améliorer';
  }

  getReputationColor(): string {
    if (this.stats.averageRating >= 4.5) return '#4CAF50';
    if (this.stats.averageRating >= 4.0) return '#8BC34A';
    if (this.stats.averageRating >= 3.5) return '#FFC107';
    if (this.stats.averageRating >= 3.0) return '#FF9800';
    return '#F44336';
  }

  exportReviews() {
    console.log('Exporter les avis');
    // À implémenter: export CSV/Excel
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('note') || lowerCommand.includes('rating')) {
      alert(`Votre note moyenne est de ${this.stats.averageRating}/5 (${this.getReputationLevel()})`);
    } else if (lowerCommand.includes('avis') || lowerCommand.includes('reviews')) {
      alert(`Vous avez ${this.stats.totalReviews} avis clients`);
    } else if (lowerCommand.includes('exporter')) {
      this.exportReviews();
    }
  }
}
