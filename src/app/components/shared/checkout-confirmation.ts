// checkout-confirmation.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-container">
      <div class="confirmation-card">
        <div class="success-icon">✅</div>
        <h1>Commande confirmée !</h1>

        <div class="order-info" *ngIf="orderData">
          <p class="order-number"><strong>Numéro :</strong> {{orderData.orderNumber}}</p>
          <p class="order-total"><strong>Total :</strong> {{orderData.total | currency:'XOF':'symbol':'1.0-0'}}</p>
          <p class="order-date"><strong>Date :</strong> {{orderData.date | date:'dd/MM/yyyy HH:mm'}}</p>
        </div>

        <p class="message">
          Votre commande a été enregistrée avec succès. Le producteur a été notifié.
        </p>

        <div class="next-steps">
          <h3>Prochaines étapes :</h3>
          <ul>
            <li>✅ Commande enregistrée</li>
            <li>⏳ En attente de confirmation du producteur</li>
            <li>📦 Préparation de votre commande</li>
            <li>🚚 Livraison selon votre choix</li>
          </ul>
        </div>

        <div class="actions">
          <button class="btn-primary" (click)="goToOrders()">
            Suivre mes commandes
          </button>
          <button class="btn-secondary" (click)="continueShopping()">
            Continuer mes achats
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
      padding: 2rem;
    }
    .confirmation-card {
      background: white;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
    }
    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #2e7d32;
    }
    .order-info {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 1rem;
      margin: 1.5rem 0;
      text-align: left;
    }
    .order-number {
      color: #2e7d32;
      font-size: 1.1rem;
    }
    .next-steps {
      text-align: left;
      margin: 2rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .next-steps ul {
      list-style: none;
      padding: 0;
    }
    .next-steps li {
      padding: 0.5rem 0;
      display: flex;
      align-items: center;
    }
    .next-steps li::before {
      content: "•";
      margin-right: 10px;
      color: #2e7d32;
      font-size: 1.5rem;
    }
    .actions {
      margin-top: 2rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }
    .btn-primary {
      background: #2e7d32;
      color: white;
    }
    .btn-primary:hover {
      background: #1b5e20;
    }
    .btn-secondary {
      background: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
    }
    .btn-secondary:hover {
      background: #e0e0e0;
    }
  `]
})
export class CheckoutConfirmationComponent implements OnInit {
  orderData: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.orderData = {
        orderNumber: navigation.extras.state['orderNumber'] || 'CMD-' + Date.now().toString().slice(-8),
        total: navigation.extras.state['total'] || 0,
        date: new Date()
      };
    } else {
      // Si on arrive directement, rediriger vers le panier
      this.router.navigate(['/buyer/cart']);
    }
  }

  goToOrders() {
    this.router.navigate(['/buyer/orders']);
  }

  continueShopping() {
    this.router.navigate(['/buyer/market']);
  }
}
