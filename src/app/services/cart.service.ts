import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  producer: string;
  price: number;
  unit: string;
  quantity: number;
  maxQuantity: number;
  image: string;
  certified: boolean;
  organic: boolean;
  deliveryType: 'pickup' | 'delivery';
  deliveryFee: number;
  notes?: string;
  selected: boolean;
  category?: string;
  location?: string;
  producerPhone?: string;
  minOrderQuantity?: number;
  stock?: number;
}

export interface DeliveryOption {
  id: string;
  name: string;
  type: 'pickup' | 'delivery';
  price: number;
  time: string;
  description: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  fee: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private readonly CART_STORAGE_KEY = 'jokko_agro_cart';

  constructor(private router: Router) {
    this.loadCartFromStorage();
  }

  // Charger le panier depuis localStorage
  private loadCartFromStorage(): void {
    const storedCart = localStorage.getItem(this.CART_STORAGE_KEY);
    if (storedCart) {
      try {
        this.cartItems = JSON.parse(storedCart);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        this.cartItems = [];
      }
    }
  }

  // Sauvegarder le panier dans localStorage
  private saveCartToStorage(): void {
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(this.cartItems));
  }

  // Ajouter un produit au panier
  addToCart(product: any, quantity: number = 1): void {
    // Générer un ID unique pour l'item du panier
    const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Vérifier si le produit existe déjà dans le panier
    const existingItemIndex = this.cartItems.findIndex(
      item => item.productId === product.id
    );

    if (existingItemIndex !== -1) {
      // Mettre à jour la quantité
      const existingItem = this.cartItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity <= existingItem.maxQuantity) {
        existingItem.quantity = newQuantity;
      } else {
        existingItem.quantity = existingItem.maxQuantity;
      }
    } else {
      // Créer un nouvel item
      const cartItem: CartItem = {
        id: cartItemId,
        productId: product.id || '',
        name: product.name,
        producer: product.producer || product.producerName || 'Producteur',
        price: product.price,
        unit: product.unit,
        quantity: Math.max(quantity, product.minOrderQuantity || 1),
        maxQuantity: product.stock || 100,
        image: product.displayImage || product.image || '📦',
        certified: product.certified || false,
        organic: product.organic || product.isOrganic || false,
        deliveryType: 'delivery', // Par défaut
        deliveryFee: 500, // Frais de livraison par défaut
        selected: true,
        category: product.category,
        location: product.location,
        producerPhone: product.contactPhone || product.producerPhone,
        minOrderQuantity: product.minOrderQuantity || 1,
        stock: product.stock || product.quantity
      };

      this.cartItems.push(cartItem);
    }

    this.saveCartToStorage();
  }

  // Obtenir tous les items du panier
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  // Mettre à jour la quantité d'un item
  updateQuantity(itemId: string, quantity: number): void {
    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      if (quantity >= 1 && quantity <= item.maxQuantity) {
        item.quantity = quantity;
        this.saveCartToStorage();
      }
    }
  }

  // Retirer un item du panier
  removeItem(itemId: string): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.saveCartToStorage();
  }

  // Toggle la sélection d'un item
  toggleSelectItem(itemId: string): void {
    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      item.selected = !item.selected;
      this.saveCartToStorage();
    }
  }

  // Sélectionner/désélectionner tous les items
  selectAllItems(select: boolean = true): void {
    this.cartItems.forEach(item => item.selected = select);
    this.saveCartToStorage();
  }

  // Mettre à jour les notes d'un item
  updateItemNotes(itemId: string, notes: string): void {
    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      item.notes = notes;
      this.saveCartToStorage();
    }
  }

  // Calculer le sous-total
  getSubtotal(): number {
    return this.cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Calculer le nombre d'items sélectionnés
  getSelectedItemsCount(): number {
    return this.cartItems.filter(item => item.selected).length;
  }

  // Vérifier si le panier est vide
  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  // Vider le panier
  clearCart(): void {
    this.cartItems = [];
    this.saveCartToStorage();
  }

  // Obtenir le total d'items
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // Navigation vers le panier
  goToCart(): void {
    this.router.navigate(['/buyer/cart']);
  }

  // Afficher une notification
  private showNotification(message: string): void {
    // Vous pouvez utiliser un service de notification ou un simple alert
    console.log('Notification:', message);

    // Créer une notification toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🛒</span>
        <div>
          <div style="font-weight: 600;">${message}</div>
          <div style="font-size: 12px; opacity: 0.9;">Cliquez pour voir le panier</div>
        </div>
      </div>
    `;

    toast.onclick = () => this.goToCart();

    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  // Données de test
  getDeliveryOptions(): DeliveryOption[] {
    return [
      {
        id: 'pickup_1',
        name: 'Retrait sur place',
        type: 'pickup',
        price: 0,
        time: '24/7',
        description: 'Retirez votre commande directement chez le producteur'
      },
      {
        id: 'delivery_1',
        name: 'Livraison standard',
        type: 'delivery',
        price: 1000,
        time: '24-48h',
        description: 'Livraison à domicile dans toute la ville'
      },
      {
        id: 'delivery_2',
        name: 'Livraison express',
        type: 'delivery',
        price: 2000,
        time: '2-4h',
        description: 'Livraison rapide pour les commandes urgentes'
      }
    ];
  }

  getPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'wave',
        name: 'Wave',
        icon: '🌊',
        description: 'Paiement mobile instantané',
        fee: 0
      },
      {
        id: 'orange_money',
        name: 'Orange Money',
        icon: '🟠',
        description: 'Paiement par Orange Money',
        fee: 50
      },
      {
        id: 'free_money',
        name: 'Free Money',
        icon: '🟡',
        description: 'Paiement par Free Money',
        fee: 50
      },
      {
        id: 'cash',
        name: 'Paiement à la livraison',
        icon: '💵',
        description: 'Paiement en espèces à la livraison',
        fee: 0
      }
    ];
  }
}
