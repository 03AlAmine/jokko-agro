import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { CartService } from '../../../services/cart.service'; // Importez le service panier
import { Product } from '../../../services/data.interfaces';

// Définissez l'interface MarketProduct
interface MarketProduct
  extends Omit<Product, 'producerId' | 'producerPhone' | 'isActive'> {
  producer: string;
  producerId: string; // ← AJOUTER CETTE LIGNE
  producerRating: number;
  distance: number;
  rating: number;
  reviews: number;
  stock: number;
  // Propriétés calculées pour le template
  certified: boolean;
  organic: boolean;
  local: boolean;
  // Image à afficher
  displayImage: string;
}

// Définissez l'interface Category
interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './market.html',
  styleUrls: ['./market.css'],
})
export class MarketComponent implements OnInit {
  allProducts: MarketProduct[] = [];
  filteredProducts: MarketProduct[] = [];
  categories: Category[] = [];

  // Filtres
  searchQuery = '';
  selectedCategory = 'all';
  selectedCertification = 'all';
  selectedSort = 'distance';
  priceRange = [0, 100000];
  maxDistance = 50;

  // État
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';

  // Certifications
  certifications = [
    { id: 'all', name: 'Toutes' },
    { id: 'certified', name: 'Certifié' },
    { id: 'organic', name: 'Bio' },
    { id: 'local', name: 'Local' },
  ];

  // Options de tri
  sortOptions = [
    { id: 'distance', name: 'Plus proche' },
    { id: 'price_low', name: 'Prix croissant' },
    { id: 'price_high', name: 'Prix décroissant' },
    { id: 'rating', name: 'Meilleures notes' },
    { id: 'newest', name: 'Plus récent' },
  ];

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private cartService: CartService // Ajoutez le service panier
  ) {}

  async ngOnInit() {
    this.loadCategories();
    await this.loadProducts();
  }

  async loadProducts() {
    this.isLoading = true;

    try {
      // Récupérer tous les produits disponibles depuis Firebase
      const firebaseProducts = await this.getAllProductsFromFirebase();

      // Transformer les produits Firebase en produits pour le marché
      this.allProducts = firebaseProducts.map((product) =>
        this.transformToMarketProduct(product)
      );

      console.log(
        `${this.allProducts.length} produits chargés depuis Firebase`
      );

      // Appliquer les filtres initiaux
      this.applyFilters();

      // Mettre à jour les catégories avec les comptes réels
      this.updateCategoryCounts();
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      // Fallback sur des données simulées
      this.loadFallbackData();
    } finally {
      this.isLoading = false;
    }
  }

  private async getAllProductsFromFirebase(): Promise<Product[]> {
    try {
      // Vérifier si la méthode existe dans FirebaseService
      if (this.firebaseService.getAllAvailableProducts) {
        return await this.firebaseService.getAllAvailableProducts();
      } else {
        console.warn(
          "La méthode getAllAvailableProducts n'existe pas dans FirebaseService"
        );
        return [];
      }
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des produits Firebase:',
        error
      );
      return [];
    }
  }

  private transformToMarketProduct(product: Product): MarketProduct {
    // Générer des données aléatoires pour les champs manquants
    const randomDistance = Math.floor(Math.random() * 30) + 1;
    const randomRating = 3.5 + Math.random() * 1.5;
    const randomReviews = Math.floor(Math.random() * 100);
    const producerRating = 3.5 + Math.random() * 1.5;

    // Calculer les propriétés de certification
    const hasCertifications =
      (product.certifications && product.certifications.length > 0) || false;
    const isOrganic = product.isOrganic || false;
    const isLocal =
      (product.certifications && product.certifications.includes('local')) ||
      false;

    // Déterminer l'image à afficher
    const displayImage = this.getDisplayImage(product);

    return {
      id: product.id || '',
      name: product.name,
      producer: product.producerName || 'Producteur',
      producerId: product.producerId || '', // ← AJOUTER CETTE LIGNE
      producerRating: producerRating,
      price: product.price,
      unit: product.unit,
      quantity: product.quantity,
      category: product.category,

      // Image à afficher dans le template
      displayImage: displayImage,

      // Propriétés calculées pour le template
      certified: hasCertifications,
      organic: isOrganic,
      local: isLocal,

      // Données simulées pour l'instant
      distance: randomDistance,
      rating: randomRating,
      reviews: randomReviews,

      // Données réelles
      description: product.description || 'Produit agricole de qualité',
      stock: product.quantity,

      // Copier tous les autres champs
      certifications: product.certifications || [],
      isOrganic: isOrganic,
      location: product.location,
      harvestDate: product.harvestDate,
      expirationDate: product.expirationDate,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      status: product.status,
      views: product.views,
      sales: product.sales,
      producerName: product.producerName,
      minOrderQuantity: product.minOrderQuantity || 1,
      images: product.images || [],
      storageConditions: product.storageConditions,
      contactPhone: product.contactPhone,
    };
  }

  private getDisplayImage(product: Product): string {
    // Si le produit a des images, retourner la première
    if (product.images && product.images.length > 0) {
      // Si c'est une URL, retourner l'URL, sinon retourner l'icône
      if (
        product.images[0].startsWith('http') ||
        product.images[0].startsWith('data:')
      ) {
        return product.images[0];
      }
    }
    // Sinon retourner l'icône de catégorie
    return this.getCategoryIcon(product.category);
  }

// Mettez aussi à jour les données de fallback dans loadFallbackData :
private loadFallbackData() {
  console.log('Chargement des données de fallback');
  // Données simulées
  this.allProducts = [
    {
      id: '1',
      name: 'Tomates Bio',
      producer: 'Alioune Farm',
      producerId: 'producer_1', // ← AJOUTER
      producerRating: 4.8,
      price: 1500,
      unit: 'kg',
      quantity: 1,
      category: 'vegetables',
      displayImage: '🍅',
      certified: true,
      organic: true,
      local: true,
      distance: 2.5,
      rating: 4.8,
      reviews: 45,
      description: 'Tomates biologiques cultivées sans pesticides',
      stock: 50,
      certifications: ['organic', 'local'],
      isOrganic: true,
      location: 'Dakar',
      harvestDate: '2024-01-10',
      expirationDate: '2024-01-20',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
      status: 'available',
      views: 100,
      sales: 45,
      producerName: 'Alioune Farm',
      minOrderQuantity: 1,
      images: [],
      storageConditions: 'Conserver au frais',
      contactPhone: '771234567',
    },
    ];

    this.applyFilters();
    this.updateCategoryCounts();
  }

  private getCategoryIcon(categoryId: string): string {
    const icons: { [key: string]: string } = {
      vegetables: '🥦',
      fruits: '🍎',
      cereals: '🌾',
      tubers: '🥔',
      legumes: '🥜',
      spices: '🌶️',
      dairy: '🥛',
      poultry: '🐔',
    };
    return icons[categoryId] || '📦';
  }

  loadCategories() {
    this.categories = [
      { id: 'all', name: 'Tout voir', icon: '🛒', count: 0 },
      { id: 'vegetables', name: 'Légumes', icon: '🥦', count: 0 },
      { id: 'fruits', name: 'Fruits', icon: '🍎', count: 0 },
      { id: 'cereals', name: 'Céréales', icon: '🌾', count: 0 },
      { id: 'tubers', name: 'Tubercules', icon: '🥔', count: 0 },
      { id: 'legumes', name: 'Légumineuses', icon: '🥜', count: 0 },
      { id: 'poultry', name: 'Volaille', icon: '🐔', count: 0 },
      { id: 'dairy', name: 'Laitiers', icon: '🥛', count: 0 },
      { id: 'spices', name: 'Épices', icon: '🌶️', count: 0 },
    ];
  }

  private updateCategoryCounts() {
    this.categories.forEach((category) => {
      if (category.id === 'all') {
        category.count = this.allProducts.length;
      } else {
        category.count = this.allProducts.filter(
          (p) => p.category === category.id
        ).length;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    // Filtre par recherche
    if (this.searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          product.producer
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(
        (product) => product.category === this.selectedCategory
      );
    }

    // Filtre par certification
    if (this.selectedCertification !== 'all') {
      switch (this.selectedCertification) {
        case 'certified':
          filtered = filtered.filter((product) => product.certified);
          break;
        case 'organic':
          filtered = filtered.filter((product) => product.organic);
          break;
        case 'local':
          filtered = filtered.filter((product) => product.local);
          break;
      }
    }

    // Filtre par distance
    filtered = filtered.filter(
      (product) => product.distance <= this.maxDistance
    );

    // Filtre par prix
    filtered = filtered.filter(
      (product) =>
        product.price >= this.priceRange[0] &&
        product.price <= this.priceRange[1]
    );

    // Filtre par disponibilité
    filtered = filtered.filter(
      (product) => product.status === 'available' && product.stock > 0
    );

    // Tri
    filtered.sort((a, b) => {
      switch (this.selectedSort) {
        case 'distance':
          return a.distance - b.distance;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    this.filteredProducts = filtered;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  }

  getStars(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  // Méthode pour obtenir l'unité du produit (ajoutez cette méthode)
  getProductUnit(product: MarketProduct): string {
    return product.unit || 'unité';
  }

  // Méthode pour formater le prix (assurez-vous qu'elle existe)
  formatPrice(price: number): string {
    return price.toLocaleString() + ' FCFA';
  }

  addToCart(product: MarketProduct) {
    console.log('Ajouter au panier:', product);

    // Vérifier la quantité minimale
    const quantity = product.minOrderQuantity || 1;

    if (product.stock >= quantity) {
      // Utiliser le service panier
      this.cartService.addToCart(product, quantity);

      // Vous pouvez aussi afficher une notification personnalisée
      this.showAddToCartNotification(product.name, quantity);
    } else {
      alert(
        `Stock insuffisant. Seulement ${product.stock} ${product.unit} disponible(s).`
      );
    }
  }

  // Méthode pour afficher une notification d'ajout au panier
  private showAddToCartNotification(productName: string, quantity: number) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideUp 0.3s ease;
      display: flex;
      align-items: center;
      gap: 15px;
      cursor: pointer;
    `;

    notification.innerHTML = `
      <div style="font-size: 28px;">🛒</div>
      <div>
        <div style="font-weight: 600; margin-bottom: 5px;">${productName}</div>
 au panier
        </div>
        <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
          👉 Cliquez pour voir le panier
        </div>
      </div>
    `;

    // Rediriger vers le panier au clic
    notification.onclick = () => {
      this.cartService.goToCart();
      document.body.removeChild(notification);
    };

    document.body.appendChild(notification);

    // Supprimer la notification après 4 secondes
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
  }

  // Méthode utilitaire pour obtenir l'unité du produit

  viewProductDetails(product: MarketProduct) {
    console.log('Voir détails:', product);

    // Pour l'instant, afficher les détails dans une alerte
    const details = `
      🛒 **${product.name}**

      👨‍🌾 **Producteur:** ${product.producer}
      📍 **Localisation:** ${product.location}
      📊 **Catégorie:** ${this.getCategoryName(product.category)}

      💰 **Prix:** ${this.formatPrice(product.price)}/${product.unit}
      📦 **Stock disponible:** ${product.stock} ${product.unit}
      📋 **Quantité minimale:** ${product.minOrderQuantity || 1} ${product.unit}

      ⭐ **Note du producteur:** ${product.producerRating.toFixed(1)}/5
      📊 **Note du produit:** ${product.rating.toFixed(1)}/5 (${
      product.reviews
    } avis)

      📝 **Description:**
      ${product.description}

      ✅ **Certifications:** ${product.certifications?.join(', ') || 'Aucune'}
      🌱 **Bio:** ${product.organic ? 'Oui ✅' : 'Non ❌'}
      📍 **Local:** ${product.local ? 'Oui ✅' : 'Non ❌'}

      🗓️ **Récolté le:** ${product.harvestDate || 'Non spécifié'}
      ⏳ **Expire le:** ${product.expirationDate || 'Non spécifié'}

      📞 **Contact:** ${product.contactPhone || 'Non disponible'}
    `;

    alert(details);
  }

  toggleFavorite(productId: string) {
    if (!productId) {
      console.error('ID du produit non valide');
      return;
    }
    console.log('Toggle favori:', productId);
    // TODO: Implémenter le service des favoris
  }

  getProductStatus(product: MarketProduct): string {
    if (product.stock === 0 || product.status !== 'available') return 'Épuisé';
    if (product.stock < (product.minOrderQuantity || 1)) return 'Stock limité';
    return 'Disponible';
  }

  getProductStatusClass(product: MarketProduct): string {
    if (product.stock === 0 || product.status !== 'available')
      return 'status-out';
    if (product.stock < (product.minOrderQuantity || 1)) return 'status-low';
    return 'status-available';
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedCertification = 'all';
    this.selectedSort = 'distance';
    this.priceRange = [0, 100000];
    this.maxDistance = 50;
    this.applyFilters();
  }

  getFilteredCount(): number {
    return this.filteredProducts.length;
  }

  getCertifiedProductsCount(): number {
    return this.allProducts.filter((p) => p.certified).length;
  }

  getUniqueProducersCount(): number {
    const uniqueProducers = new Set(
      this.filteredProducts.map((p) => p.producer)
    );
    return uniqueProducers.size;
  }

  getTotalProducts(): number {
    return this.filteredProducts.length;
  }

  getUniqueProducers(products: MarketProduct[]): number {
    const uniqueProducers = new Set(products.map((p) => p.producer));
    return uniqueProducers.size;
  }
}
