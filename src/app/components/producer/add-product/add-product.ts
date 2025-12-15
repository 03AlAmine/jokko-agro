import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';

interface ProductCategory {
  id: string;
  name: string;
  icon: string;
}

interface Unit {
  id: string;
  name: string;
  symbol: string;
}

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css'],
})
export class AddProductComponent implements OnInit {
  productForm: FormGroup;
  isSubmitting = false;
  selectedImage: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  categories: ProductCategory[] = [
    { id: 'vegetables', name: 'Légumes', icon: '🥦' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'cereals', name: 'Céréales', icon: '🌾' },
    { id: 'tubers', name: 'Tubercules', icon: '🥔' },
    { id: 'legumes', name: 'Légumineuses', icon: '🥜' },
    { id: 'spices', name: 'Épices', icon: '🌶️' },
    { id: 'dairy', name: 'Produits laitiers', icon: '🥛' },
    { id: 'poultry', name: 'Volaille', icon: '🐔' },
  ];

  units: Unit[] = [
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
    {
      id: 'organic',
      name: 'Bio',
      description: 'Agriculture biologique certifiée',
    },
    { id: 'local', name: 'Local', description: 'Produit local' },
    {
      id: 'fairtrade',
      name: 'Commerce équitable',
      description: 'Certifié commerce équitable',
    },
    { id: 'seasonal', name: 'Saison', description: 'Produit de saison' },
  ];

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(100)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: ['kg', Validators.required],
      certifications: [[]],
      isOrganic: [false],
      harvestDate: [''],
      expirationDate: [''],
      storageConditions: [''],
      location: [''],
      contactPhone: [''],
      minOrderQuantity: [1],
    });
  }

  ngOnInit() {
    // Pré-remplir avec les infos de l'utilisateur
    const user = this.authService.getUserData();
    if (user) {
      this.productForm.patchValue({
        contactPhone: user.phone,
        location: 'Dakar, Sénégal', // À remplacer par la géolocalisation réelle
      });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;

      // Prévisualisation de l'image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

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

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.icon : '📦';
  }

  async onSubmit() {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.isSubmitting = true;

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const productData = {
        ...this.productForm.value,
        producerId: user.uid,
        producerName: this.authService.getUserData()?.fullName,
        producerPhone: this.productForm.value.contactPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'available',
        views: 0,
        sales: 0,
        rating: 0,
        isActive: true,
        images: [], // Les URLs d'images seront ajoutées après upload
      };

      console.log('Produit à ajouter:', productData);

      // Ici, nous ajouterons l'upload vers Firebase Storage et Firestore
      // Pour l'instant, simulation
      alert('Produit ajouté avec succès! (Simulation)');

      // Redirection vers la liste des produits
      setTimeout(() => {
        this.router.navigate(['/producer/products']);
      }, 1500);
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du produit:", error);
      alert('Erreur: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  triggerFileUpload() {
    const input = document.getElementById(
      'imageUpload'
    ) as HTMLInputElement | null;
    input?.click();
  }

  // Gestion des commandes vocales
  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('ajouter') || lowerCommand.includes('valider')) {
      this.onSubmit();
    } else if (
      lowerCommand.includes('annuler') ||
      lowerCommand.includes('retour')
    ) {
      this.router.navigate(['/producer/products']);
    } else if (
      lowerCommand.includes('photo') ||
      lowerCommand.includes('image')
    ) {
      this.triggerFileUpload(); // utilise la méthode TS
    }
  }
  triggerFileInput() {
    const input = document.getElementById('imageUpload') as HTMLInputElement;
    input?.click();
  }

  // Calcul du prix estimé
  calculateEstimatedPrice() {
    const price = this.productForm.get('price')?.value;
    const quantity = this.productForm.get('quantity')?.value;

    if (price && quantity) {
      return price * quantity;
    }
    return 0;
  }
}
