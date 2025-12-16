import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, Conversation, Message } from '../../../services/firebase.service';

@Component({
  selector: 'app-messages-producer',
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
      this.conversations = await this.firebaseService.getProducerConversations(this.currentUser.uid);
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
      senderName: this.currentUser.fullName,
      senderRole: 'producer',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: true,
      type: 'text'
    };

    try {
      const result = await this.firebaseService.sendMessage(messageData);

      if (result.success) {
        this.newMessage = '';
        this.scrollToBottom();
      } else {
        alert('Erreur lors de l\'envoi du message: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      alert('Erreur lors de l\'envoi du message');
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
    const now = new Date();
    const messageTime = new Date(conversation.lastMessageTime);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;

    return messageTime.toLocaleDateString();
  }

  getMessageTime(message: Message): string {
    return message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async archiveConversation(conversationId: string) {
    try {
      await this.firebaseService.updateConversation(conversationId, { status: 'archived' });

      // Mettre à jour localement
      const conversation = this.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.status = 'archived';
      }

      if (this.selectedConversation?.id === conversationId) {
        this.selectedConversation = null;
        this.messages = [];
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      alert('Erreur lors de l\'archivage de la conversation');
    }
  }

  getUnreadCount(): number {
    return this.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }

  getActiveConversationsCount(): number {
    return this.conversations.filter(c => c.status === 'active').length;
  }

  private loadFallbackData() {
    // Données de fallback (comme avant)
  }
}
