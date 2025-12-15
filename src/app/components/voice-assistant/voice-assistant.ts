import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voice-assistant.html',
  styleUrls: ['./voice-assistant.css']
})
export class VoiceAssistantComponent implements OnInit, OnDestroy {
  isListening = false;
  voiceCommand = '';
  recognition: any;
  showHelp = false;

  // Phrases d'exemple pour guider l'utilisateur
  exampleCommands = [
    { fr: "Maa bëgg a jënd", wolof: "Je veux acheter", action: "Ouvre le marché" },
    { fr: "Damaa bëgg a yokk benn tomate", wolof: "Je veux ajouter une tomate", action: "Ouvre ajout produit" },
    { fr: "Jox ma prix bi", wolof: "Donne-moi le prix", action: "Affiche les prix" },
    { fr: "Maa bëgg a féetël sama produits", wolof: "Je veux voir mes produits", action: "Ouvre liste produits" }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.initVoiceRecognition();
  }

  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  initVoiceRecognition() {
    // Pour une vraie implémentation, utiliser la Web Speech API
    // Cette version est simplifiée pour le prototype
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition ||
                                (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR, wolof'; // Support français et wolof
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.voiceCommand = transcript;
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      console.warn('Reconnaissance vocale non supportée par ce navigateur');
    }
  }

  toggleListening() {
    if (!this.recognition) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur. Essayez Chrome ou Edge.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.recognition.start();
      this.isListening = true;
      this.voiceCommand = '';
    }
  }

  processVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    // Logique de traitement des commandes vocales
    if (lowerCommand.includes('acheter') || lowerCommand.includes('jënd')) {
      this.router.navigate(['/market']);
      this.speak('Je vous amène au marché');
    }
    else if (lowerCommand.includes('vendre') || lowerCommand.includes('yokk')) {
      this.router.navigate(['/producer/add-product']);
      this.speak('Ouvre le formulaire pour ajouter un produit');
    }
    else if (lowerCommand.includes('prix') || lowerCommand.includes('prix bi')) {
      this.router.navigate(['/prices']);
      this.speak('Voici les prix moyens du marché');
    }
    else if (lowerCommand.includes('produits') || lowerCommand.includes('féetël')) {
      this.router.navigate(['/producer/products']);
      this.speak('Voici vos produits');
    }
    else if (lowerCommand.includes('aide') || lowerCommand.includes('help')) {
      this.showHelp = true;
      this.speak('Voici les commandes disponibles');
    }
    else {
      this.speak('Je n\'ai pas compris la commande. Dites "aide" pour voir les options.');
    }
  }

  speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      speechSynthesis.speak(utterance);
    }
  }

  toggleHelp() {
    this.showHelp = !this.showHelp;
  }
}
