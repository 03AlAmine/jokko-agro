import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- Ajoute ceci

import { AuthService } from '../../../services/auth.service';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  status: 'available' | 'sold_out' | 'draft';
  image: string;
  sales: number;
  rating: number;
  createdAt: Date;
  lastUpdated: Date;
  certified: boolean;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  searchQuery = '';
  selectedCategory = 'all';
  selectedStatus = 'all';

  categories = [
    { id: 'all', name: 'Toutes les catégories' },
    { id: 'vegetables', name: 'Légumes' },
    { id: 'fruits', name: 'Fruits' },
    { id: 'cereals', name: 'Céréales' },
    { id: 'tubers', name: 'Tubercules' }
  ];

  statuses = [
    { id: 'all', name: 'Tous les statuts' },
    { id: 'available', name: 'Disponible' },
    { id: 'sold_out', name: 'Épuisé' },
    { id: 'draft', name: 'Brouillon' }
  ];

  sortBy = 'recent';
  sortOptions = [
    { id: 'recent', name: 'Plus récent' },
    { id: 'oldest', name: 'Plus ancien' },
    { id: 'price_low', name: 'Prix croissant' },
    { id: 'price_high', name: 'Prix décroissant' },
    { id: 'sales', name: 'Meilleures ventes' },
    { id: 'rating', name: 'Meilleures notes' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    // Données simulées
    this.products = [
      {
        id: '1',
        name: 'Tomates Bio',
        category: 'vegetables',
        price: 1500,
        quantity: 50,
        unit: 'kg',
        status: 'available',
        image: '🍅',
        sales: 45,
        rating: 4.8,
        createdAt: new Date('2024-01-10'),
        lastUpdated: new Date('2024-01-15'),
        certified: true
      },
      {
        id: '2',
        name: 'Carottes Fraîches',
        category: 'vegetables',
        price: 1200,
        quantity: 30,
        unit: 'kg',
        status: 'available',
        image: '🥕',
        sales: 28,
        rating: 4.5,
        createdAt: new Date('2024-01-12'),
        lastUpdated: new Date('2024-01-14'),
        certified: true
      },
      {
        id: '3',
        name: 'Oignons Rouges',
        category: 'vegetables',
        price: 800,
        quantity: 0,
        unit: 'kg',
        status: 'sold_out',
        image: '🧅',
        sales: 60,
        rating: 4.2,
        createdAt: new Date('2024-01-05'),
        lastUpdated: new Date('2024-01-13'),
        certified: false
      },
      {
        id: '4',
        name: 'Mangues Kent',
        category: 'fruits',
        price: 2000,
        quantity: 20,
        unit: 'kg',
        status: 'available',
        image: '🥭',
        sales: 15,
        rating: 4.9,
        createdAt: new Date('2024-01-08'),
        lastUpdated: new Date('2024-01-12'),
        certified: true
      },
      {
        id: '5',
        name: 'Riz Local',
        category: 'cereals',
        price: 5000,
        quantity: 100,
        unit: 'sac',
        status: 'available',
        image: '🌾',
        sales: 8,
        rating: 4.7,
        createdAt: new Date('2024-01-03'),
        lastUpdated: new Date('2024-01-10'),
        certified: true
      },
      {
        id: '6',
        name: 'Pommes de Terre',
        category: 'tubers',
        price: 900,
        quantity: 40,
        unit: 'kg',
        status: 'draft',
        image: '🥔',
        sales: 0,
        rating: 0,
        createdAt: new Date('2024-01-14'),
        lastUpdated: new Date('2024-01-14'),
        certified: false
      }
    ];

    this.filteredProducts = [...this.products];
    this.isLoading = false;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.products];

    // Filtre par recherche
    if (this.searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    // Filtre par statut
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === this.selectedStatus);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'recent':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'oldest':
          return a.lastUpdated.getTime() - b.lastUpdated.getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'sales':
          return b.sales - a.sales;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    this.filteredProducts = filtered;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'available': return 'Disponible';
      case 'sold_out': return 'Épuisé';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'available': return 'status-available';
      case 'sold_out': return 'status-sold-out';
      case 'draft': return 'status-draft';
      default: return '';
    }
  }

  getTotalValue(product: Product): number {
    return product.price * product.quantity;
  }

  editProduct(productId: string) {
    console.log('Modifier produit:', productId);
    // À implémenter: navigation vers édition
  }

  deleteProduct(productId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      console.log('Supprimer produit:', productId);
      // À implémenter: suppression de Firestore
    }
  }

  duplicateProduct(productId: string) {
    console.log('Dupliquer produit:', productId);
    // À implémenter: duplication
  }

  updateStatus(productId: string, newStatus: string) {
    console.log('Changer statut:', productId, '→', newStatus);
    // À implémenter: mise à jour dans Firestore
  }

  getTotalProductsCount(): number {
    return this.products.length;
  }

  getAvailableProductsCount(): number {
    return this.products.filter(p => p.status === 'available').length;
  }

  getTotalValueSum(): number {
    return this.products.reduce((sum, product) => sum + this.getTotalValue(product), 0);
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('ajouter') || lowerCommand.includes('nouveau')) {
      window.location.href = '/producer/add-product';
    } else if (lowerCommand.includes('rechercher') && lowerCommand.includes('tomates')) {
      this.searchQuery = 'tomates';
      this.applyFilters();
    } else if (lowerCommand.includes('filtrer') && lowerCommand.includes('disponible')) {
      this.selectedStatus = 'available';
      this.applyFilters();
    }
  }
}
