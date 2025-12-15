import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.login(
        this.credentials.email,
        this.credentials.password
      );

      if (!result.success) {
        this.errorMessage = result.error || 'Email ou mot de passe incorrect';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur de connexion';
    } finally {
      this.isLoading = false;
    }
  }
}
