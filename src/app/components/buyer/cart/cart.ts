import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CartService, CartItem, DeliveryOption, PaymentMethod } from '../../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  deliveryOptions: DeliveryOption[] = [];
  paymentMethods: PaymentMethod[] = [];

  // Sélections
  selectedDeliveryOption = '';
  selectedPaymentMethod = '';
  deliveryNotes = '';

  // États
  isLoading = false;
  isCheckingOut = false;

  // Coupons
  couponCode = '';
  appliedCoupon: { code: string; discount: number; type: 'percentage' | 'fixed' } | null = null;

  // Données de livraison
  deliveryAddress = {
    street: '',
    city: 'Dakar',
    phone: '',
    instructions: ''
  };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCartItems();
    this.loadDeliveryOptions();
    this.loadPaymentMethods();
    this.loadUserData();
  }

  loadCartItems() {
    this.cartItems = this.cartService.getCartItems();
    if (this.cartItems.length > 0) {
      this.selectedDeliveryOption = 'delivery_1';
    }
  }

  loadDeliveryOptions() {
    this.deliveryOptions = this.cartService.getDeliveryOptions();
  }

  loadPaymentMethods() {
    this.paymentMethods = this.cartService.getPaymentMethods();
    this.selectedPaymentMethod = 'wave';
  }

  loadUserData() {
    const userData = this.authService.getUserData();
    if (userData) {
      this.deliveryAddress.phone = userData.phone || '';
    }
  }

  // Calculs
  getSubtotal(): number {
    return this.cartService.getSubtotal();
  }

  getDeliveryFee(): number {
    if (!this.selectedDeliveryOption) return 0;

    const option = this.deliveryOptions.find(o => o.id === this.selectedDeliveryOption);
    if (!option) return 0;

    // Ajouter les frais de livraison individuels des produits
    const itemsFee = this.cartItems
      .filter(item => item.selected && item.deliveryType === 'delivery')
      .reduce((total, item) => total + item.deliveryFee, 0);

    return option.price + itemsFee;
  }

  getPaymentFee(): number {
    if (!this.selectedPaymentMethod) return 0;

    const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
    return method ? method.fee : 0;
  }

  getCouponDiscount(): number {
    if (!this.appliedCoupon) return 0;

    const subtotal = this.getSubtotal();

    if (this.appliedCoupon.type === 'percentage') {
      return (subtotal * this.appliedCoupon.discount) / 100;
    } else {
      return Math.min(this.appliedCoupon.discount, subtotal);
    }
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();
    const deliveryFee = this.getDeliveryFee();
    const paymentFee = this.getPaymentFee();
    const couponDiscount = this.getCouponDiscount();

    return subtotal + deliveryFee + paymentFee - couponDiscount;
  }

  getSelectedItemsCount(): number {
    return this.cartService.getSelectedItemsCount();
  }

  // Actions sur les items
  updateQuantity(itemId: string, change: number) {
    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity >= 1 && newQuantity <= item.maxQuantity) {
        this.cartService.updateQuantity(itemId, newQuantity);
        this.loadCartItems(); // Recharger les items
      }
    }
  }

  removeItem(itemId: string) {
    if (confirm('Êtes-vous sûr de vouloir retirer cet article du panier ?')) {
      this.cartService.removeItem(itemId);
      this.loadCartItems(); // Recharger les items
    }
  }

  toggleSelectItem(itemId: string) {
    this.cartService.toggleSelectItem(itemId);
    this.loadCartItems(); // Recharger les items
  }

  selectAllItems() {
    const allSelected = this.cartItems.every(item => item.selected);
    this.cartService.selectAllItems(!allSelected);
    this.loadCartItems(); // Recharger les items
  }

  updateItemNotes(itemId: string, notes: string) {
    this.cartService.updateItemNotes(itemId, notes);
  }

  // Coupons (même logique que précédemment)
  applyCoupon() {
    if (!this.couponCode.trim()) return;

    const coupons: { [key: string]: { discount: number; type: 'percentage' | 'fixed' } } = {
      'JOKKO10': { discount: 10, type: 'percentage' },
      'BIENVENUE': { discount: 2000, type: 'fixed' },
      'LOCAL2024': { discount: 15, type: 'percentage' }
    };

    const coupon = coupons[this.couponCode.toUpperCase()];

    if (coupon) {
      this.appliedCoupon = {
        code: this.couponCode.toUpperCase(),
        discount: coupon.discount,
        type: coupon.type
      };
      this.couponCode = '';
    } else {
      alert('Code promo invalide ou expiré');
    }
  }

  removeCoupon() {
    this.appliedCoupon = null;
  }

  // Commande
  async proceedToCheckout() {
    if (this.getSelectedItemsCount() === 0) {
      alert('Veuillez sélectionner au moins un article');
      return;
    }

    if (!this.selectedDeliveryOption) {
      alert('Veuillez sélectionner un mode de livraison');
      return;
    }

    if (!this.selectedPaymentMethod) {
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    if (this.selectedDeliveryOption.includes('delivery') && !this.deliveryAddress.street) {
      alert('Veuillez saisir votre adresse de livraison');
      return;
    }

    this.isCheckingOut = true;

    try {
      // Simuler le processus de commande
      await this.simulateCheckout();

      // Créer les données de commande
      const orderData = this.createOrderData();

      // Sauvegarder la commande
      this.saveOrder(orderData);

      // Vider le panier
      this.cartService.clearCart();

      // Rediriger vers la confirmation
      this.router.navigate(['/buyer/checkout-confirmation'], {
        state: { order: orderData }
      });

    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Une erreur est survenue lors de la commande. Veuillez réessayer.');
    } finally {
      this.isCheckingOut = false;
    }
  }

  private async simulateCheckout() {
    return new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  }

  private createOrderData() {
    const selectedItems = this.cartItems.filter(item => item.selected);
    const deliveryOption = this.deliveryOptions.find(o => o.id === this.selectedDeliveryOption);
    const paymentMethod = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);

    return {
      items: selectedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal: this.getSubtotal(),
      delivery: {
        option: deliveryOption,
        address: this.deliveryAddress,
        fee: this.getDeliveryFee()
      },
      payment: {
        method: paymentMethod,
        fee: this.getPaymentFee()
      },
      coupon: this.appliedCoupon,
      discount: this.getCouponDiscount(),
      total: this.getTotal(),
      orderDate: new Date(),
      orderNumber: 'CMD-' + Date.now().toString().slice(-8),
      status: 'pending'
    };
  }

  private saveOrder(orderData: any) {
    try {
      // Sauvegarder dans localStorage
      const orders = JSON.parse(localStorage.getItem('jokko_agro_orders') || '[]');
      orders.push(orderData);
      localStorage.setItem('jokko_agro_orders', JSON.stringify(orders));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
    }
  }

  // Navigation
  continueShopping() {
    this.router.navigate(['/buyer/market']);
  }

  // Utilitaires
  formatPrice(price: number): string {
    return price.toLocaleString() + ' FCFA';
  }

  getDeliveryOptionName(optionId: string): string {
    const option = this.deliveryOptions.find(o => o.id === optionId);
    return option ? option.name : '';
  }

  getPaymentMethodName(methodId: string): string {
    const method = this.paymentMethods.find(m => m.id === methodId);
    return method ? method.name : '';
  }

  getItemDeliveryFee(item: CartItem): number {
    if (item.deliveryType === 'delivery' && this.selectedDeliveryOption.includes('delivery')) {
      return item.deliveryFee;
    }
    return 0;
  }

  canCheckout(): boolean {
    return this.getSelectedItemsCount() > 0 &&
           !!this.selectedDeliveryOption &&
           !!this.selectedPaymentMethod;
  }

  // Voice command
  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('commander') || lowerCommand.includes('payer')) {
      this.proceedToCheckout();
    } else if (lowerCommand.includes('tout sélectionner')) {
      this.selectAllItems();
    } else if (lowerCommand.includes('continuer') || lowerCommand.includes('shopping')) {
      this.continueShopping();
    }
  }
    areAllItemsSelected(): boolean {
    if (!this.cartItems || this.cartItems.length === 0) {
      return false;
    }
    return this.cartItems.every(item => item.selected);
  }
}
