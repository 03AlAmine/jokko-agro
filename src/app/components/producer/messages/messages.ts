import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  product?: string;
  status: 'active' | 'archived';
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'product';
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css']
})
export class MessagesComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;

  newMessage = '';
  searchQuery = '';
  isLoading = false;

  // Données simulées
  buyers = [
    { id: '1', name: 'Alioune Diop', avatar: '👨🏾' },
    { id: '2', name: 'Fatou Ndiaye', avatar: '👩🏾' },
    { id: '3', name: 'Moussa Fall', avatar: '👨🏾' },
    { id: '4', name: 'Aminata Sow', avatar: '👩🏾' },
    { id: '5', name: 'Ibrahima Diallo', avatar: '👨🏾' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.conversations = [
      {
        id: '1',
        buyerId: '1',
        buyerName: 'Alioune Diop',
        buyerAvatar: '👨🏾',
        lastMessage: 'Bonjour, les tomates sont toujours disponibles ?',
        lastMessageTime: new Date('2024-01-15T10:30:00'),
        unreadCount: 2,
        product: 'Tomates Bio',
        status: 'active'
      },
      {
        id: '2',
        buyerId: '2',
        buyerName: 'Fatou Ndiaye',
        buyerAvatar: '👩🏾',
        lastMessage: 'Merci pour la livraison rapide !',
        lastMessageTime: new Date('2024-01-14T15:20:00'),
        unreadCount: 0,
        product: 'Carottes Fraîches',
        status: 'active'
      },
      {
        id: '3',
        buyerId: '3',
        buyerName: 'Moussa Fall',
        buyerAvatar: '👨🏾',
        lastMessage: 'Pouvez-vous me confirmer le prix pour 10kg ?',
        lastMessageTime: new Date('2024-01-14T09:15:00'),
        unreadCount: 1,
        product: 'Oignons Rouges',
        status: 'active'
      },
      {
        id: '4',
        buyerId: '4',
        buyerName: 'Aminata Sow',
        buyerAvatar: '👩🏾',
        lastMessage: 'À quelle heure puis-je passer ?',
        lastMessageTime: new Date('2024-01-13T16:45:00'),
        unreadCount: 0,
        product: 'Mangues Kent',
        status: 'active'
      },
      {
        id: '5',
        buyerId: '5',
        buyerName: 'Ibrahima Diallo',
        buyerAvatar: '👨🏾',
        lastMessage: 'La commande a été annulée',
        lastMessageTime: new Date('2024-01-12T11:10:00'),
        unreadCount: 0,
        status: 'archived'
      }
    ];
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);

    // Marquer comme lu
    conversation.unreadCount = 0;

    // Focus sur le champ de message après un délai
    setTimeout(() => {
      const input = document.querySelector('.message-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  loadMessages(conversationId: string) {
    // Messages simulés
    this.messages = [
      {
        id: '1',
        conversationId: '1',
        senderId: '1',
        senderName: 'Alioune Diop',
        content: 'Bonjour, les tomates sont toujours disponibles ?',
        timestamp: new Date('2024-01-15T10:30:00'),
        read: true,
        type: 'text'
      },
      {
        id: '2',
        conversationId: '1',
        senderId: 'producer',
        senderName: 'Vous',
        content: 'Bonjour Alioune ! Oui, il me reste 20kg de tomates bio.',
        timestamp: new Date('2024-01-15T10:35:00'),
        read: true,
        type: 'text'
      },
      {
        id: '3',
        conversationId: '1',
        senderId: '1',
        senderName: 'Alioune Diop',
        content: 'Parfait ! Je prends 5kg. C\'est possible de passer ce soir ?',
        timestamp: new Date('2024-01-15T10:40:00'),
        read: false,
        type: 'text'
      },
      {
        id: '4',
        conversationId: '1',
        senderId: '1',
        senderName: 'Alioune Diop',
        content: 'Et quel est le prix au kg ?',
        timestamp: new Date('2024-01-15T10:42:00'),
        read: false,
        type: 'text'
      }
    ];

    // Scroll vers le bas des messages
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      conversationId: this.selectedConversation.id,
      senderId: 'producer',
      senderName: 'Vous',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: true,
      type: 'text'
    };

    this.messages.push(message);

    // Mettre à jour la conversation
    const conversation = this.conversations.find(c => c.id === this.selectedConversation?.id);
    if (conversation) {
      conversation.lastMessage = this.newMessage;
      conversation.lastMessageTime = new Date();

      // Remettre la conversation en haut de la liste
      this.conversations = this.conversations.filter(c => c.id !== conversation.id);
      this.conversations.unshift(conversation);
    }

    this.newMessage = '';

    // Simuler une réponse automatique après 2 secondes
    setTimeout(() => {
      if (this.selectedConversation) {
        const buyer = this.buyers.find(b => b.id === this.selectedConversation?.buyerId);
        if (buyer) {
          const reply: Message = {
            id: (Date.now() + 1).toString(),
            conversationId: this.selectedConversation.id,
            senderId: buyer.id,
            senderName: buyer.name,
            content: 'Merci pour votre réponse !',
            timestamp: new Date(),
            read: false,
            type: 'text'
          };
          this.messages.push(reply);

          // Marquer comme non lu
          if (conversation) {
            conversation.unreadCount++;
            conversation.lastMessage = reply.content;
            conversation.lastMessageTime = reply.timestamp;
          }
        }
      }
    }, 2000);

    this.scrollToBottom();
  }

  scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getFilteredConversations() {
    if (!this.searchQuery) return this.conversations;

    return this.conversations.filter(conv =>
      conv.buyerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (conv.product && conv.product.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
      conv.lastMessage.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  getConversationTime(conversation: Conversation): string {
    const now = new Date();
    const messageTime = new Date(conversation.lastMessageTime);
    const diffHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) {
      return 'À l\'instant';
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return messageTime.toLocaleDateString();
    }
  }

  getMessageTime(message: Message): string {
    return message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  archiveConversation(conversationId: string) {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.status = 'archived';
      if (this.selectedConversation?.id === conversationId) {
        this.selectedConversation = null;
        this.messages = [];
      }
    }
  }

  deleteConversation(conversationId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      this.conversations = this.conversations.filter(c => c.id !== conversationId);
      if (this.selectedConversation?.id === conversationId) {
        this.selectedConversation = null;
        this.messages = [];
      }
    }
  }

  sendQuickResponse(response: string) {
    this.newMessage = response;
    this.sendMessage();
  }

  getUnreadCount(): number {
    return this.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }

  getActiveConversationsCount(): number {
    return this.conversations.filter(c => c.status === 'active').length;
  }

  handleVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('bonjour') || lowerCommand.includes('salut')) {
      this.sendQuickResponse('Bonjour ! Comment puis-je vous aider ?');
    } else if (lowerCommand.includes('disponible') || lowerCommand.includes('stock')) {
      this.sendQuickResponse('Oui, le produit est disponible en stock.');
    } else if (lowerCommand.includes('prix')) {
      this.sendQuickResponse('Le prix est de 1500 FCFA le kilogramme.');
    } else if (lowerCommand.includes('livraison')) {
      this.sendQuickResponse('Nous proposons la livraison dans toute la ville.');
    }
  }
}
