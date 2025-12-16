import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface ScannedProduct {
  id: string;
  name: string;
  producer: string;
  certificationHash: string;
  certificationDate: Date;
  harvestDate: Date;
  location: string;
  verified: boolean;
  fraudDetected: boolean;
  history: {
    date: Date;
    action: string;
    location: string;
  }[];
}

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.html',
  styleUrls: ['./scan.css']
})
export class ScanComponent implements OnInit {
  @ViewChild('videoElement') videoElement!: ElementRef;

  // États du scanner
  isScanning = false;
  hasCameraPermission = false;
  cameraError = '';

  // Résultats du scan
  scannedProduct: ScannedProduct | null = null;
  scanHistory: ScannedProduct[] = [];

  // Données simulées pour le démo
  demoProducts: ScannedProduct[] = [
    {
      id: '1',
      name: 'Tomates Bio Certifiées',
      producer: 'Alioune Farm',
      certificationHash: '0x1234...5678',
      certificationDate: new Date('2024-01-10'),
      harvestDate: new Date('2024-01-05'),
      location: 'Dakar, Sénégal',
      verified: true,
      fraudDetected: false,
      history: [
        { date: new Date('2024-01-05'), action: 'Récolte', location: 'Dakar Farm' },
        { date: new Date('2024-01-08'), action: 'Certification', location: 'Certification Center' },
        { date: new Date('2024-01-12'), action: 'Distribution', location: 'Dakar Market' }
      ]
    },
    {
      id: '2',
      name: 'Carottes Fraîches',
      producer: 'Bio Garden',
      certificationHash: '0xabcd...efgh',
      certificationDate: new Date('2024-01-08'),
      harvestDate: new Date('2024-01-03'),
      location: 'Thiès, Sénégal',
      verified: true,
      fraudDetected: false,
      history: [
        { date: new Date('2024-01-03'), action: 'Récolte', location: 'Thiès Farm' },
        { date: new Date('2024-01-06'), action: 'Certification', location: 'Certification Center' },
        { date: new Date('2024-01-09'), action: 'Transport', location: 'Thiès to Dakar' },
        { date: new Date('2024-01-10'), action: 'Distribution', location: 'Dakar Market' }
      ]
    },
    {
      id: '3',
      name: 'Riz Local',
      producer: 'Sénégal Riz',
      certificationHash: '0xfake...hash',
      certificationDate: new Date('2024-01-15'),
      harvestDate: new Date('2024-01-01'),
      location: 'Saint-Louis, Sénégal',
      verified: false,
      fraudDetected: true,
      history: [
        { date: new Date('2024-01-01'), action: 'Récolte', location: 'Saint-Louis' },
        { date: new Date('2024-01-14'), action: 'Certification modifiée', location: 'Unknown' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadScanHistory();
  }

  async startScanner() {
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
      this.cameraError = 'Votre navigateur ne supporte pas la caméra.';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.hasCameraPermission = true;
      this.isScanning = true;

      const video = this.videoElement.nativeElement;
      video.srcObject = stream;
      video.play();

      // Simuler la détection de QR code après 2 secondes
      setTimeout(() => {
        this.simulateQRScan();
      }, 2000);

    } catch (error: any) {
      this.cameraError = 'Accès à la caméra refusé. Veuillez autoriser l\'accès.';
      console.error('Erreur caméra:', error);
    }
  }

  stopScanner() {
    this.isScanning = false;

    const video = this.videoElement.nativeElement;
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  }

  simulateQRScan() {
    // Simuler un scan aléatoire
    const randomIndex = Math.floor(Math.random() * this.demoProducts.length);
    const product = this.demoProducts[randomIndex];

    this.scannedProduct = { ...product };
    this.stopScanner();

    // Ajouter à l'historique
    if (!this.scanHistory.find(p => p.id === product.id)) {
      this.scanHistory.unshift(product);
      this.saveScanHistory();
    }
  }

  simulateFraudScan() {
    // Simuler un scan frauduleux
    const fraudProduct = {
      ...this.demoProducts[2],
      certificationHash: '0xFAKE...HASH123'
    };

    this.scannedProduct = fraudProduct;
    this.stopScanner();
  }

  loadScanHistory() {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
      this.scanHistory = JSON.parse(saved).map((item: any) => ({
        ...item,
        certificationDate: new Date(item.certificationDate),
        harvestDate: new Date(item.harvestDate),
        history: item.history.map((h: any) => ({
          ...h,
          date: new Date(h.date)
        }))
      }));
    }
  }

  saveScanHistory() {
    localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory.slice(0, 10)));
  }

  clearHistory() {
    this.scanHistory = [];
    localStorage.removeItem('scanHistory');
  }

  viewProductDetails() {
    if (this.scannedProduct) {
      // Navigation vers la page produit
      console.log('Voir détails:', this.scannedProduct);
      alert(`Navigation vers les détails de ${this.scannedProduct.name}`);
    }
  }

  getVerificationIcon(): string {
    if (!this.scannedProduct) return '';
    if (this.scannedProduct.fraudDetected) return '❌';
    if (this.scannedProduct.verified) return '✅';
    return '⚠️';
  }

  getVerificationText(): string {
    if (!this.scannedProduct) return '';
    if (this.scannedProduct.fraudDetected) return 'FRAUDE DÉTECTÉE';
    if (this.scannedProduct.verified) return 'CERTIFICAT VALIDE';
    return 'NON VÉRIFIÉ';
  }

  getVerificationColor(): string {
    if (!this.scannedProduct) return '#666';
    if (this.scannedProduct.fraudDetected) return '#f44336';
    if (this.scannedProduct.verified) return '#4caf50';
    return '#ff9800';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copié dans le presse-papier!'))
      .catch(err => console.error('Erreur copie:', err));
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('scanner') || lowerCommand.includes('commencer')) {
      this.startScanner();
    } else if (lowerCommand.includes('arrêter') || lowerCommand.includes('stop')) {
      this.stopScanner();
    } else if (lowerCommand.includes('historique')) {
      document.querySelector('.history-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
