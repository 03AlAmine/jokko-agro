import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  userData = {
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'producer' | 'buyer' | '',
    location: 'Dakar, Sénégal', // Ajoutez ce champ avec une valeur par défaut
  };

  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async onSubmit() {
    // Validation
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (!this.userData.role) {
      this.errorMessage = 'Veuillez sélectionner un rôle';
      return;
    }

    if (
      !this.userData.phone ||
      !this.userData.email ||
      !this.userData.fullName
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Assurez-vous que la location n'est pas undefined
      const registrationData = {
        ...this.userData,
        location: this.userData.location || 'Dakar, Sénégal'
      };

      const result = await this.authService.register(registrationData);

      if (!result.success) {
        this.errorMessage = result.error || "Erreur lors de l'inscription";
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur inconnue';
    } finally {
      this.isLoading = false;
    }
  }

  // Validation d'email simple
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validation de téléphone (Sénégal)
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^(77|78|70|76)[0-9]{7}$/;
    const cleanPhone = phone.replace(/\s+/g, '');
    return phoneRegex.test(cleanPhone);
  }
}
