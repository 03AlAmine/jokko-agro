import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, Conversation, Message } from '../../../services/firebase.service';

@Component({
  selector: 'app-messages-buyer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css']
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;

  newMessage = '';
  searchQuery = '';
  isLoading = false;
  currentUser: any;

  // Propriétés pour la nouvelle conversation
  showNewConversationModal = false;
  availableProducers: any[] = [];
  selectedProducerId: string = '';
  messageToProducer: string = '';
  isStartingConversation = false;

  // Pour la recherche de producteurs
  producerSearchQuery = '';

  private messagesUnsubscribe: (() => void) | null = null;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getUserData();
    if (this.currentUser) {
      await this.loadConversations();
    }
  }

  ngOnDestroy() {
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
    }
  }

  async loadConversations() {
    this.isLoading = true;
    try {
      this.conversations = await this.firebaseService.getBuyerConversations(this.currentUser.uid);
      console.log('Conversations chargées:', this.conversations);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      this.loadFallbackData();
    } finally {
      this.isLoading = false;
    }
  }

  async selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;

    // Se désabonner de l'ancienne écoute
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
    }

    // Charger les messages existants
    await this.loadMessages(conversation.id!);

    // Marquer les messages comme lus
    await this.firebaseService.markMessagesAsRead(conversation.id!, this.currentUser.uid);

    // Mettre à jour la conversation locale
    conversation.unreadCount = 0;

    // S'abonner aux nouveaux messages en temps réel
    this.messagesUnsubscribe = this.firebaseService.subscribeToConversationMessages(
      conversation.id!,
      (newMessages) => {
        this.messages = newMessages;
        this.scrollToBottom();
      }
    );
  }

  async loadMessages(conversationId: string) {
    try {
      this.messages = await this.firebaseService.getConversationMessages(conversationId);
      this.scrollToBottom();
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation || !this.currentUser) return;

    const messageData: Omit<Message, 'id'> = {
      conversationId: this.selectedConversation.id!,
      senderId: this.currentUser.uid,
      senderName: this.currentUser.fullName || this.currentUser.displayName || 'Acheteur',
      senderRole: 'buyer',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: false, // Le producteur ne l'a pas encore lu
      type: 'text'
    };

    try {
      const result = await this.firebaseService.sendMessage(messageData);

      if (result.success) {
        this.newMessage = '';
        this.scrollToBottom();

        // Mettre à jour la dernière conversation
        if (this.selectedConversation) {
          this.selectedConversation.lastMessage = messageData.content;
          this.selectedConversation.lastMessageTime = messageData.timestamp;
        }
      } else {
        alert('Erreur lors de l\'envoi du message: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  }

  // Méthodes pour démarrer une nouvelle conversation
  async openNewConversationModal() {
    this.showNewConversationModal = true;
    await this.loadAvailableProducers();
  }

  async loadAvailableProducers() {
    try {
      this.availableProducers = await this.firebaseService.getAvailableProducers();
    } catch (error) {
      console.error('Erreur lors du chargement des producteurs:', error);
      this.loadFallbackProducers();
    }
  }

// Nouvelle méthode pour démarrer une conversation depuis le modal
// Méthode pour démarrer une conversation depuis le modal (sans productId/productName)
async startConversationFromModal() {
  if (!this.selectedProducerId || !this.messageToProducer.trim()) {
    alert('Veuillez sélectionner un producteur et écrire un message');
    return;
  }

  const selectedProducer = this.filteredProducers.find(p => p.id === this.selectedProducerId);
  if (!selectedProducer) {
    alert('Producteur non trouvé');
    return;
  }

  this.isStartingConversation = true;
  try {
    const result = await this.firebaseService.startConversationWithBuyerAndMessage(
      this.currentUser.uid,
      this.currentUser.fullName || this.currentUser.displayName || 'Acheteur',
      this.selectedProducerId,
      selectedProducer.name,
      this.messageToProducer.trim()
      // Pas de productId ni productName ici
    );

    if (result.success && result.conversationId) {
      // Fermer le modal
      this.showNewConversationModal = false;
      this.resetModal();

      // Recharger les conversations
      await this.loadConversations();

      // Sélectionner la nouvelle conversation
      const newConversation = this.conversations.find(c => c.id === result.conversationId);
      if (newConversation) {
        await this.selectConversation(newConversation);
      }
    } else {
      alert('Erreur lors du démarrage de la conversation: ' + (result.error || 'Erreur inconnue'));
    }
  } catch (error) {
    console.error('Erreur lors du démarrage de la conversation:', error);
    alert('Erreur lors du démarrage de la conversation');
  } finally {
    this.isStartingConversation = false;
  }
}

// Méthode pour démarrer une conversation depuis une page produit (avec productId/productName)
async startConversationFromProduct(producerId: string, producerName: string, productId: string, productName: string) {
  // Préparer le message automatique
  const autoMessage = `Bonjour, je suis intéressé par votre produit "${productName}". Pouvez-vous me donner plus d'informations ?`;

  this.isStartingConversation = true;
  try {
    const result = await this.firebaseService.startConversationWithBuyerAndMessage(
      this.currentUser.uid,
      this.currentUser.fullName || this.currentUser.displayName || 'Acheteur',
      producerId,
      producerName,
      autoMessage,
      productId,    // Passer productId
      productName   // Passer productName
    );

    if (result.success && result.conversationId) {
      // Recharger les conversations
      await this.loadConversations();

      // Sélectionner la nouvelle conversation
      const newConversation = this.conversations.find(c => c.id === result.conversationId);
      if (newConversation) {
        await this.selectConversation(newConversation);
      }

      // Optionnel: Rediriger vers la page des messages si vous n'y êtes pas déjà
      // this.router.navigate(['/buyer/messages']);
    } else {
      alert('Erreur lors du démarrage de la conversation: ' + (result.error || 'Erreur inconnue'));
    }
  } catch (error) {
    console.error('Erreur lors du démarrage de la conversation:', error);
    alert('Erreur lors du démarrage de la conversation');
  } finally {
    this.isStartingConversation = false;
  }
}
  // Méthodes utilitaires
  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-container-sms');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  getConversationTime(conversation: Conversation): string {
    if (!conversation.lastMessageTime) return 'Jamais';

    const now = new Date();
    const messageTime = new Date(conversation.lastMessageTime);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;

    return messageTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getMessageTime(message: Message): string {
    return message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getUnreadCount(): number {
    return this.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }

  // Filtrer les conversations par recherche
  get filteredConversations(): Conversation[] {
    if (!this.searchQuery.trim()) return this.conversations;

    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(conversation =>
      conversation.producerName?.toLowerCase().includes(query) ||
      conversation.productName?.toLowerCase().includes(query) ||
      conversation.lastMessage?.toLowerCase().includes(query)
    );
  }

  // Filtrer les producteurs disponibles par recherche
  get filteredProducers() {
    if (!this.producerSearchQuery.trim()) return this.availableProducers;

    const query = this.producerSearchQuery.toLowerCase();
    return this.availableProducers.filter(producer =>
      producer.name?.toLowerCase().includes(query) ||
      producer.farmName?.toLowerCase().includes(query) ||
      producer.location?.toLowerCase().includes(query)
    );
  }

  // Méthodes pour gérer le blocage/signalement
  async reportConversation() {
    if (!this.selectedConversation) return;

    const reason = prompt('Pourquoi souhaitez-vous signaler cette conversation ?');
    if (reason) {
      try {
        await this.firebaseService.reportConversation(
          this.selectedConversation.id!,
          this.currentUser.uid,
          reason
        );
        alert('Conversation signalée. Notre équipe va examiner le problème.');
      } catch (error) {
        console.error('Erreur lors du signalement:', error);
        alert('Erreur lors du signalement');
      }
    }
  }

  async blockProducer() {
    if (!this.selectedConversation) return;

    if (confirm(`Êtes-vous sûr de vouloir bloquer ${this.selectedConversation.producerName} ? Vous ne pourrez plus recevoir de messages de sa part.`)) {
      try {
        await this.firebaseService.blockUser(
          this.currentUser.uid,
          this.selectedConversation.producerId,
          'producer'
        );
        alert('Producteur bloqué avec succès');

        // Retirer la conversation de la liste
        this.conversations = this.conversations.filter(
          c => c.producerId !== this.selectedConversation!.producerId
        );
        this.selectedConversation = null;
        this.messages = [];
      } catch (error) {
        console.error('Erreur lors du blocage:', error);
        alert('Erreur lors du blocage du producteur');
      }
    }
  }

  // Données de fallback pour le développement
  private loadFallbackData() {
    this.conversations = [
      {
        id: '1',
        buyerId: this.currentUser.uid,
        buyerName: this.currentUser.fullName || 'Acheteur',
        buyerAvatar: '👤',
        producerId: 'prod1',
        producerName: 'Ferme Dupont',
        producerAvatar: '🌾',
        lastMessage: 'Bonjour, votre commande est prête !',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        unreadCount: 0,
        productId: 'prod123',
        productName: 'Tomates bio',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        updatedAt: new Date()
      },
      {
        id: '2',
        buyerId: this.currentUser.uid,
        buyerName: this.currentUser.fullName || 'Acheteur',
        buyerAvatar: '👤',
        producerId: 'prod2',
        producerName: 'Vignoble Martin',
        producerAvatar: '🍇',
        lastMessage: 'Nous avons de nouveaux vins disponibles',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        unreadCount: 2,
        productId: 'prod456',
        productName: 'Vin rouge AOP',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        updatedAt: new Date()
      }
    ];
  }

  private loadFallbackProducers() {
    this.availableProducers = [
      {
        id: 'prod1',
        name: 'Ferme Dupont',
        farmName: 'La Ferme Bio',
        avatar: '🌾',
        location: 'Normandie',
        rating: 4.8,
        reviews: 42,
        description: 'Producteur de légumes bio depuis 15 ans'
      },
      {
        id: 'prod2',
        name: 'Vignoble Martin',
        farmName: 'Domaine Martin',
        avatar: '🍇',
        location: 'Bordeaux',
        rating: 4.9,
        reviews: 67,
        description: 'Vigneron familial depuis 3 générations'
      },
      {
        id: 'prod3',
        name: 'Fromagerie Lambert',
        farmName: 'Les Fromages du Val',
        avatar: '🧀',
        location: 'Savoie',
        rating: 4.7,
        reviews: 35,
        description: 'Fromages au lait cru traditionnels'
      }
    ];
  }

  // Méthode pour formater la date
  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Méthode pour réinitialiser le modal
  resetModal() {
    this.selectedProducerId = '';
    this.messageToProducer = '';
    this.producerSearchQuery = '';
  }

  // Méthode pour vérifier si un producteur est bloqué
  async isProducerBlocked(producerId: string): Promise<boolean> {
    try {
      return await this.firebaseService.checkIfUserIsBlocked(this.currentUser.uid, producerId);
    } catch (error) {
      console.error('Erreur lors de la vérification du blocage:', error);
      return false;
    }
  }

  // Méthode pour charger plus de producteurs (pagination)
  async loadMoreProducers() {
    // Implémentation de la pagination si nécessaire
    console.log('Chargement de plus de producteurs...');
  }

  // Méthode pour trier les producteurs
  sortProducers(criteria: 'name' | 'rating' | 'reviews'): void {
    switch (criteria) {
      case 'name':
        this.availableProducers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        this.availableProducers.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        this.availableProducers.sort((a, b) => b.reviews - a.reviews);
        break;
    }
  }

  // Méthode pour obtenir le producteur sélectionné
  get selectedProducer() {
    return this.availableProducers.find(p => p.id === this.selectedProducerId);
  }
}
