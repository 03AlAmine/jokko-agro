import { Component, OnInit, inject, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, Product } from '../../../services/firebase.service';

interface FormSection {
  id: string;
  number: number;
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css']
})
export class AddProductComponent implements OnInit, AfterViewInit {
  @ViewChild('mainImageUpload') mainImageUpload!: ElementRef<HTMLInputElement>;
  @ViewChild('additionalImagesUpload') additionalImagesUpload!: ElementRef<HTMLInputElement>;

  productForm: FormGroup;
  isSubmitting = false;
  currentSection = 'basic-info';
  completionPercentage = 0;

  // Images
  mainImageFile: File | null = null;
  mainImagePreview: string | null = null;
  additionalImages: Array<{ file: File; preview: string }> = [];

  // Calculs
  descriptionLength = 0;
  estimatedTotal = 0;

  // Sections
  sections: FormSection[] = [
    { id: 'basic-info', number: 1, title: 'Informations', description: 'Données de base', completed: false },
    { id: 'price-quantity', number: 2, title: 'Prix', description: 'Tarification', completed: false },
    { id: 'images', number: 3, title: 'Images', description: 'Photos produit', completed: false },
    { id: 'certifications', number: 4, title: 'Certifications', description: 'Qualités', completed: false },
    { id: 'additional-details', number: 5, title: 'Détails', description: 'Informations +', completed: false }
  ];

  // Data
  categories = [
    { id: 'vegetables', name: 'Légumes', icon: '🥦' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'cereals', name: 'Céréales', icon: '🌾' },
    { id: 'tubers', name: 'Tubercules', icon: '🥔' },
    { id: 'legumes', name: 'Légumineuses', icon: '🥜' },
    { id: 'spices', name: 'Épices', icon: '🌶️' },
    { id: 'dairy', name: 'Produits laitiers', icon: '🥛' },
    { id: 'poultry', name: 'Volaille', icon: '🐔' },
  ];

  units = [
    { id: 'kg', name: 'Kilogramme', symbol: 'kg' },
    { id: 'g', name: 'Gramme', symbol: 'g' },
    { id: 'l', name: 'Litre', symbol: 'L' },
    { id: 'ml', name: 'Millilitre', symbol: 'ml' },
    { id: 'piece', name: 'Pièce', symbol: 'pce' },
    { id: 'dozen', name: 'Douzaine', symbol: 'dz' },
    { id: 'bunch', name: 'Botte', symbol: 'bt' },
    { id: 'bag', name: 'Sac', symbol: 'sac' },
  ];

  certifications = [
    { id: 'organic', name: 'Bio', description: 'Agriculture biologique', icon: '🌱' },
    { id: 'local', name: 'Local', description: 'Produit local', icon: '📍' },
    { id: 'fairtrade', name: 'Équitable', description: 'Commerce équitable', icon: '🤝' },
    { id: 'seasonal', name: 'Saison', description: 'Produit de saison', icon: '🌞' },
  ];

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(100), Validators.max(1000000)]],
      quantity: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      unit: ['kg', Validators.required],
      certifications: [[]],
      isOrganic: [false],
      harvestDate: [''],
      expirationDate: [''],
      storageConditions: ['', Validators.maxLength(200)],
      location: ['', Validators.maxLength(100)],
      contactPhone: ['', [Validators.pattern(/^[0-9\s\-\(\)\.]+$/)]],
      minOrderQuantity: [1, [Validators.min(1), Validators.max(100)]],
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.setupFormListeners();
    this.prefillUserData();
    this.updateCompletion();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.scrollToSection(this.currentSection);
    }, 100);
  }

  private initializeForm() {
    const description = this.productForm.get('description')?.value || '';
    this.descriptionLength = description.length;
    this.updateEstimatedTotal();
  }

  private setupFormListeners() {
    this.productForm.valueChanges.subscribe(() => {
      this.updateCompletion();
      this.updateEstimatedTotal();
    });

    this.productForm.get('description')?.valueChanges.subscribe((value: string) => {
      this.descriptionLength = value?.length || 0;
    });
  }

  private prefillUserData() {
    const user = this.authService.getUserData();
    if (user) {
      this.productForm.patchValue({
        contactPhone: user.phone || '',
        location: user.location || 'Dakar, Sénégal',
      });
    }
  }

  // Navigation
  goToSection(sectionId: string) {
    this.currentSection = sectionId;
    this.scrollToSection(sectionId);
    this.updateActiveSection();
  }

  goToNextSection() {
    const currentIndex = this.sections.findIndex(s => s.id === this.currentSection);
    if (currentIndex < this.sections.length - 1) {
      const nextSection = this.sections[currentIndex + 1];
      this.goToSection(nextSection.id);
    }
  }

  goToPreviousSection() {
    const currentIndex = this.sections.findIndex(s => s.id === this.currentSection);
    if (currentIndex > 0) {
      const prevSection = this.sections[currentIndex - 1];
      this.goToSection(prevSection.id);
    }
  }

  isFirstSection(): boolean {
    return this.currentSection === this.sections[0].id;
  }

  isLastSection(): boolean {
    return this.currentSection === this.sections[this.sections.length - 1].id;
  }

  private scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  private updateActiveSection() {
    this.sections.forEach(section => {
      if (section.id === this.currentSection) {
        section.completed = this.isSectionCompleted(section.id);
      }
    });
  }

  // Form validation
  showFieldError(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isSectionCompleted(sectionId: string): boolean {
    switch (sectionId) {
      case 'basic-info':
        return !!(this.productForm.get('name')?.valid &&
                  this.productForm.get('category')?.valid &&
                  this.productForm.get('description')?.valid);
      case 'price-quantity':
        return !!(this.productForm.get('price')?.valid &&
                  this.productForm.get('quantity')?.valid &&
                  this.productForm.get('unit')?.valid);
      case 'images':
        return !!this.mainImagePreview;
      case 'certifications':
        return true;
      case 'additional-details':
        return true;
      default:
        return false;
    }
  }

  updateCompletion() {
    let completedCount = 0;
    this.sections.forEach(section => {
      if (this.isSectionCompleted(section.id)) {
        completedCount++;
      }
    });

    this.completionPercentage = Math.round((completedCount / this.sections.length) * 100);

    this.sections = this.sections.map(section => ({
      ...section,
      completed: this.isSectionCompleted(section.id)
    }));
  }

  // Navigation events
  navigateToSection(sectionId: string, event: Event) {
    event.preventDefault();
    this.goToSection(sectionId);
  }

  // Image handling
  triggerImageUpload() {
    this.mainImageUpload.nativeElement.click();
  }

  triggerAdditionalUpload() {
    this.additionalImagesUpload.nativeElement.click();
  }

  onMainImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateImageFile(file)) {
        this.mainImageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.mainImagePreview = reader.result as string;
          this.updateCompletion();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onAdditionalImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      files.slice(0, 4 - this.additionalImages.length).forEach(file => {
        if (this.validateImageFile(file)) {
          const reader = new FileReader();
          reader.onload = () => {
            this.additionalImages.push({
              file,
              preview: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
    input.value = '';
  }

  removeMainImage() {
    this.mainImageFile = null;
    this.mainImagePreview = null;
    this.updateCompletion();
  }

  removeAdditionalImage(index: number) {
    this.additionalImages.splice(index, 1);
  }

  private validateImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      this.showNotification('error', 'Format non supporté. Utilisez JPG, PNG ou WebP.');
      return false;
    }

    if (file.size > maxSize) {
      this.showNotification('error', 'Fichier trop volumineux (max 5MB).');
      return false;
    }

    return true;
  }

  // Certifications
  toggleCertification(certId: string) {
    const currentCerts = this.productForm.get('certifications')?.value || [];
    const index = currentCerts.indexOf(certId);

    if (index === -1) {
      currentCerts.push(certId);
    } else {
      currentCerts.splice(index, 1);
    }

    this.productForm.patchValue({ certifications: currentCerts });
  }

  isCertificationSelected(certId: string): boolean {
    const currentCerts = this.productForm.get('certifications')?.value || [];
    return currentCerts.includes(certId);
  }

  // Calculations
  updateEstimatedTotal() {
    const price = this.productForm.get('price')?.value || 0;
    const quantity = this.productForm.get('quantity')?.value || 0;
    this.estimatedTotal = price * quantity;
  }

  updateDescriptionLength(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.descriptionLength = textarea.value.length;
  }

  // Form actions
  async submitForm() {
    if (this.productForm.invalid) {
      this.showNotification('error', 'Veuillez corriger les erreurs dans le formulaire');
      this.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Veuillez vous connecter pour publier un produit');
      }

      const userData = this.authService.getUserData();

      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        ...this.productForm.value,
        producerId: user.uid,
        producerName: userData?.fullName || 'Producteur',
        producerPhone: this.productForm.value.contactPhone || userData?.phone || '',
        producerEmail: user.email || '',
        status: 'available',
        views: 0,
        sales: 0,
        rating: 0,
        totalRating: 0,
        ratingCount: 0,
        isActive: true,
        images: [],
        featuredImage: this.mainImagePreview || '',
        tags: this.productForm.value.certifications || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        harvestDate: this.formatDate(this.productForm.value.harvestDate),
        expirationDate: this.formatDate(this.productForm.value.expirationDate),
      };

      const imageUrls = await this.uploadImages();
      if (imageUrls.length > 0) {
        productData.images = imageUrls;
      }

      const result = await this.firebaseService.addProduct(productData);

      if (result.success) {
        this.showNotification('success', 'Produit publié avec succès !');

        setTimeout(() => {
          this.router.navigate(['/producer/products'], {
            queryParams: { published: true }
          });
        }, 2000);
      } else {
        throw new Error(result.error || "Erreur lors de la publication");
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      this.showNotification('error', error.message || 'Une erreur est survenue');
    } finally {
      this.isSubmitting = false;
    }
  }

  async validateAndSubmit() {
    const incompleteSections = this.sections.filter(s => !this.isSectionCompleted(s.id) && s.id !== 'certifications' && s.id !== 'additional-details');

    if (incompleteSections.length > 0) {
      const sectionNames = incompleteSections.map(s => s.title).join(', ');
      this.showNotification('warning', `Veuillez compléter les sections : ${sectionNames}`);

      if (incompleteSections.length > 0) {
        this.goToSection(incompleteSections[0].id);
      }
      return;
    }

    await this.submitForm();
  }

  private async uploadImages(): Promise<string[]> {
    const imageUrls: string[] = [];

    if (this.mainImageFile) {
      try {
        const url = await this.firebaseService.uploadImage(
          this.mainImageFile,
          `products/${Date.now()}_main`
        );
     //   imageUrls.push(url);
      } catch (error) {
        console.error('Erreur upload image principale:', error);
      }
    }

    for (const [index, image] of this.additionalImages.entries()) {
      try {
        const url = await this.firebaseService.uploadImage(
          image.file,
          `products/${Date.now()}_additional_${index}`
        );
       // imageUrls.push(url);
      } catch (error) {
        console.error(`Erreur upload image additionnelle ${index}:`, error);
      }
    }

    return imageUrls;
  }

  private formatDate(dateString: string): string | null {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  }

  private markAllAsTouched() {
    Object.values(this.productForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  saveAsDraft() {
    const formData = {
      ...this.productForm.value,
      mainImagePreview: this.mainImagePreview,
      additionalImages: this.additionalImages.map(img => img.preview),
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('product_draft', JSON.stringify(formData));
    this.showNotification('success', 'Brouillon sauvegardé');
  }

  showPreview() {
    this.showNotification('info', 'Prévisualisation bientôt disponible');
  }

  cancelForm() {
    if (this.productForm.dirty) {
      const confirmLeave = confirm(
        'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?'
      );
      if (!confirmLeave) return;
    }
    this.router.navigate(['/producer/products']);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'ArrowRight') {
      event.preventDefault();
      this.goToNextSection();
    }

    if (event.ctrlKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goToPreviousSection();
    }

    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveAsDraft();
    }

    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.submitForm();
    }
  }

  private showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      background: ${this.getNotificationColor(type)};
      color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      z-index: 9999;
      animation: slideInRight 0.3s ease;
      max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }

  private getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    return icons[type] || 'ℹ️';
  }

  private getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      info: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    };
    return colors[type] || '#3b82f6';
  }
}
