import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VoiceAssistantComponent } from '../voice-assistant/voice-assistant';
import { AuthService } from '../../services/auth.service';

// Imports Firebase SDK
import { doc, updateDoc } from 'firebase/firestore';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, VoiceAssistantComponent],
  templateUrl: './role-selection.html',
  styleUrls: ['./role-selection.css']
})
export class RoleSelectionComponent {
  selectedRole: 'producer' | 'buyer' | null = null;
  isLoading = false;

  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  ngOnInit() {
    // Si l'utilisateur a déjà un rôle, le rediriger
    const userRole = this.authService.getUserRole();
    if (userRole === 'producer') {
      this.router.navigate(['/producer/dashboard']);
    } else if (userRole === 'buyer') {
      this.router.navigate(['/buyer/dashboard']);
    }
  }

  selectRole(role: 'producer' | 'buyer') {
    this.selectedRole = role;
  }

  async confirmSelection() {
    if (!this.selectedRole) {
      alert('Veuillez sélectionner un rôle');
      return;
    }

    this.isLoading = true;

    try {
      // Utiliser le service AuthService pour mettre à jour le rôle
      await this.authService.updateUserRole(this.selectedRole);

      // Rediriger vers le tableau de bord approprié
      if (this.selectedRole === 'producer') {
        this.router.navigate(['/producer/dashboard']);
      } else {
        this.router.navigate(['/buyer/dashboard']);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      alert('Erreur lors de la sélection du rôle');
    } finally {
      this.isLoading = false;
    }
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('producteur') || lowerCommand.includes('vendre') || lowerCommand.includes('yokk')) {
      this.selectRole('producer');
      this.speak('Producteur sélectionné');
    } else if (lowerCommand.includes('acheteur') || lowerCommand.includes('acheter') || lowerCommand.includes('jënd')) {
      this.selectRole('buyer');
      this.speak('Acheteur sélectionné');
    } else if (lowerCommand.includes('confirmer') || lowerCommand.includes('aller')) {
      this.confirmSelection();
    }
  }

  private speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      speechSynthesis.speak(utterance);
    }
  }
}
