// notification.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  showSuccess(message: string) {
    // Implémentez une notification élégante
    console.log('Success:', message);
    // Vous pouvez utiliser un toast library ou créer le vôtre
  }

  showError(message: string) {
    console.error('Error:', message);
  }
}
