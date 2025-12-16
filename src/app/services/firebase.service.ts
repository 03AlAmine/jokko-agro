import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from 'firebase/auth';
// Correction: Imports Firestore complets
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  increment,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { environment } from '../../environments/environment';

// Dans firebase.service.ts
export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'producer' | 'buyer';
  createdAt: Date;
  location: string;
  reputation?: number; // Optionnel
}
// Interface Product
export interface Product {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  certifications: string[];
  isOrganic: boolean;
  harvestDate?: string;
  expirationDate?: string;
  storageConditions?: string;
  location: string;
  contactPhone: string;
  minOrderQuantity: number;
  producerId: string;
  producerName: string;
  producerPhone: string;
  images: string[];
  status: 'available' | 'sold_out' | 'inactive';
  views: number;
  sales: number;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface Conversation {
  id?: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  producerId: string;
  producerName: string;
  producerAvatar?: string; // AJOUTER CETTE PROPRIÉTÉ
  productId?: string;
  productName?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'archived' | 'blocked'; // AJOUTER 'blocked'
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'producer' | 'buyer';
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'product';
  metadata?: {
    productId?: string;
    imageUrl?: string;
  };
}
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  uploadImage(mainImageFile: File, arg1: string) {
    throw new Error('Method not implemented.');
  }
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private firestore = getFirestore(this.app);
  private storage = getStorage(this.app); // Gardez privé

  // Ajoutez un getter public
  get storageInstance() {
    return this.storage;
  }
  currentUser: User | null = null;
  userData: UserData | null = null;
  isLoading = true;

  constructor() {
    this.setupAuthPersistence();
    this.setupAuthListener();
  }

  private async setupAuthPersistence() {
    try {
      // Configurer la persistance locale (session + local storage)
      await setPersistence(this.auth, browserLocalPersistence);
    } catch (error) {
      console.error('Erreur de configuration de persistance:', error);
    }
  }

  private setupAuthListener() {
    onAuthStateChanged(this.auth, async (user) => {
      this.isLoading = true;
      this.currentUser = user;

      if (user) {
        console.log('Utilisateur connecté:', user.email);
        await this.loadUserData(user.uid);
      } else {
        console.log('Aucun utilisateur connecté');
        this.userData = null;
      }

      this.isLoading = false;
    });
  }
  // Dans la classe FirebaseService
  isAuthInitialized(): boolean {
    return !this.isLoading && this.auth.currentUser !== undefined;
  }

  getCurrentAuthUser(): User | null {
    return this.auth.currentUser;
  }
  async register(userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );

      // Préparer les données de l'utilisateur SANS valeurs undefined
      const userDataToSave: any = {
        uid: userCredential.user.uid,
        email: userData.email,
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        role: userData.role || 'buyer',
        createdAt: new Date(),
        location: userData.location || 'Dakar, Sénégal',
      };

      // Ajouter reputation uniquement pour les producteurs
      if (userData.role === 'producer') {
        userDataToSave.reputation = 0;
      }
      // Pour les acheteurs, ne pas inclure le champ reputation du tout

      console.log('Données utilisateur à enregistrer:', userDataToSave);

      await setDoc(
        doc(this.firestore, 'users', userCredential.user.uid),
        userDataToSave
      );

      // Stocker localement
      this.userData = userDataToSave as UserData;

      return { success: true };
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error.code),
      };
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error.code),
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  }

  // Dans firebase.service.ts
  private async loadUserData(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();

        // Données utilisateur avec valeurs par défaut
        const userData: UserData = {
          uid: data['uid'] || uid,
          email: data['email'] || '',
          fullName: data['fullName'] || '',
          phone: data['phone'] || '',
          role: data['role'] || 'buyer',
          createdAt: data['createdAt']?.toDate() || new Date(),
          location: data['location'] || 'Dakar, Sénégal',
          reputation:
            data['reputation'] !== undefined
              ? data['reputation']
              : data['role'] === 'producer'
              ? 0
              : undefined,
        };

        this.userData = userData;
        console.log('Données utilisateur chargées:', this.userData);

        // Stocker dans localStorage
        localStorage.setItem('userData', JSON.stringify(this.userData));
      } else {
        console.warn(
          'Document utilisateur non trouvé dans Firestore pour uid:',
          uid
        );

        // Si le document n'existe pas mais l'utilisateur est connecté,
        // créez un document par défaut
        const currentUser = this.auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
          console.log('Création du document utilisateur manquant...');
          await this.createMissingUserDocument(uid);
        }
      }
    } catch (error) {
      console.error('Erreur de chargement des données utilisateur:', error);

      // Récupérer depuis localStorage
      const cachedData = localStorage.getItem('userData');
      if (cachedData) {
        try {
          this.userData = JSON.parse(cachedData);
          console.log('Données utilisateur restaurées depuis localStorage');
        } catch (parseError) {
          console.error(
            'Erreur de parsing des données localStorage:',
            parseError
          );
        }
      }
    }
  }
  private async createMissingUserDocument(uid: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) return;

      const userDataToSave: any = {
        uid: uid,
        email: currentUser.email || '',
        fullName: currentUser.displayName || 'Utilisateur',
        phone: '',
        role: 'buyer', // Par défaut
        createdAt: new Date(),
        location: 'Dakar, Sénégal',
        // Pas de reputation pour les acheteurs par défaut
      };

      await setDoc(doc(this.firestore, 'users', uid), userDataToSave);
      console.log('Document utilisateur créé pour:', uid);

      // Recharger les données
      await this.loadUserData(uid);
    } catch (error) {
      console.error(
        'Erreur lors de la création du document utilisateur:',
        error
      );
    }
  }

  async updateUserRole(uid: string, role: 'producer' | 'buyer'): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'users', uid), { role });
      if (this.userData) {
        this.userData.role = role;
        localStorage.setItem('userData', JSON.stringify(this.userData));
      }
    } catch (error) {
      console.error('Erreur de mise à jour du rôle:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  getUserRole(): 'producer' | 'buyer' | null {
    return this.userData?.role || null;
  }

  private getFirebaseErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Cet email est déjà utilisé',
      'auth/invalid-email': 'Email invalide',
      'auth/operation-not-allowed': 'Opération non autorisée',
      'auth/weak-password': 'Mot de passe trop faible (minimum 6 caractères)',
      'auth/user-disabled': 'Compte désactivé',
      'auth/user-not-found': 'Utilisateur non trouvé',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion',
    };

    return errorMessages[code] || 'Une erreur est survenue';
  }

  // Nettoyer le cache
  clearCache() {
    localStorage.removeItem('userData');
  }
  // Méthode pour ajouter un produit
  async addProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; productId?: string; error?: string }> {
    try {
      const productWithTimestamp = {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'available' as const,
        views: 0,
        sales: 0,
        rating: 0,
        isActive: true,
        images: productData.images || [],
      };

      const docRef = await addDoc(
        collection(this.firestore, 'products'),
        productWithTimestamp
      );

      console.log('Produit ajouté avec ID:', docRef.id);

      return {
        success: true,
        productId: docRef.id,
      };
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du produit:", error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Erreur lors de l'ajout du produit",
      };
    }
  }

  // Méthode pour récupérer les produits d'un producteur
  async getProducerProducts(producerId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(this.firestore, 'products'),
        where('producerId', '==', producerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data['name'],
          category: data['category'],
          description: data['description'],
          price: data['price'],
          quantity: data['quantity'],
          unit: data['unit'],
          certifications: data['certifications'] || [],
          isOrganic: data['isOrganic'] || false,
          harvestDate: data['harvestDate'],
          expirationDate: data['expirationDate'],
          storageConditions: data['storageConditions'],
          location: data['location'],
          contactPhone: data['contactPhone'],
          minOrderQuantity: data['minOrderQuantity'] || 1,
          producerId: data['producerId'],
          producerName: data['producerName'],
          producerPhone: data['producerPhone'],
          images: data['images'] || [],
          status: data['status'] || 'available',
          views: data['views'] || 0,
          sales: data['sales'] || 0,
          rating: data['rating'] || 0,
          isActive: data['isActive'] !== undefined ? data['isActive'] : true,
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        });
      });

      return products;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return [];
    }
  }

  // Méthode pour récupérer un produit par ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const productDoc = await getDoc(
        doc(this.firestore, 'products', productId)
      );

      if (productDoc.exists()) {
        const data = productDoc.data();
        return {
          id: productDoc.id,
          ...data,
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        } as Product;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      return null;
    }
  }

  // Méthode pour mettre à jour un produit
  async updateProduct(
    productId: string,
    productData: Partial<Product>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...productData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(this.firestore, 'products', productId), updateData);

      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors de la mise à jour',
      };
    }
  }

  // Dans firebase.service.ts, ajoutez ces méthodes :

  // Méthode pour supprimer un produit
  async deleteProduct(
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(this.firestore, 'products', productId));
      console.log('Produit supprimé:', productId);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la suppression du produit:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors de la suppression',
      };
    }
  }

  // Méthode pour mettre à jour le statut d'un produit
  async updateProductStatus(
    productId: string,
    status: Product['status']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(this.firestore, 'products', productId), {
        status,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors de la mise à jour',
      };
    }
  }

  // Méthode pour augmenter le compteur de vues
  async incrementProductViews(productId: string): Promise<void> {
    try {
      const productRef = doc(this.firestore, 'products', productId);
      await updateDoc(productRef, {
        views: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur lors de l'incrémentation des vues:", error);
    }
  }

  //------------------buyer----------------------
  // Dans firebase.service.ts

  // Méthode pour récupérer tous les produits disponibles
  async getAllAvailableProducts(): Promise<Product[]> {
    try {
      const q = query(
        collection(this.firestore, 'products'),
        where('status', '==', 'available'),
        where('isActive', '==', true),
        where('quantity', '>', 0),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data['name'],
          category: data['category'],
          description: data['description'],
          price: data['price'],
          quantity: data['quantity'],
          unit: data['unit'],
          certifications: data['certifications'] || [],
          isOrganic: data['isOrganic'] || false,
          harvestDate: data['harvestDate'],
          expirationDate: data['expirationDate'],
          storageConditions: data['storageConditions'],
          location: data['location'],
          contactPhone: data['contactPhone'],
          minOrderQuantity: data['minOrderQuantity'] || 1,
          producerId: data['producerId'],
          producerName: data['producerName'],
          producerPhone: data['producerPhone'],
          images: data['images'] || [],
          status: data['status'] || 'available',
          views: data['views'] || 0,
          sales: data['sales'] || 0,
          rating: data['rating'] || 0,
          isActive: data['isActive'] !== undefined ? data['isActive'] : true,
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        });
      });

      console.log(`${products.length} produits disponibles récupérés`);
      return products;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des produits disponibles:',
        error
      );
      return [];
    }
  }

  // Méthode pour rechercher des produits
  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAllAvailableProducts();

      // Filtrage côté client (pour l'instant)
      // Pour une recherche plus avancée, utilisez Algolia ou similaires
      return allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.producerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de produits:', error);
      return [];
    }
  }

  // ==================== CONVERSATIONS ====================

  async createConversation(
    conversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      // S'assurer que tous les champs optionnels sont correctement gérés
      const conversationWithTimestamp = {
        ...conversationData,
        // S'assurer que les champs optionnels ne sont pas undefined
        productId: conversationData.productId || null,
        productName: conversationData.productName || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(this.firestore, 'conversations'),
        conversationWithTimestamp
      );
      return { success: true, conversationId: docRef.id };
    } catch (error: any) {
      console.error('Erreur lors de la création de la conversation:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors de la création de la conversation',
      };
    }
  }

  async getProducerConversations(producerId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(this.firestore, 'conversations'),
        where('producerId', '==', producerId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          buyerId: data['buyerId'],
          buyerName: data['buyerName'],
          buyerAvatar:
            data['buyerAvatar'] || this.getAvatarForName(data['buyerName']),
          producerId: data['producerId'],
          producerName: data['producerName'],
          productId: data['productId'],
          productName: data['productName'],
          lastMessage: data['lastMessage'],
          lastMessageTime: data['lastMessageTime']?.toDate() || new Date(),
          unreadCount: data['unreadCount'] || 0,
          status: data['status'] || 'active',
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        });
      });

      return conversations;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return [];
    }
  }

  async getBuyerConversations(buyerId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(this.firestore, 'conversations'),
        where('buyerId', '==', buyerId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          buyerId: data['buyerId'],
          buyerName: data['buyerName'],
          buyerAvatar:
            data['buyerAvatar'] || this.getAvatarForName(data['buyerName']),
          producerId: data['producerId'],
          producerName: data['producerName'],
          productId: data['productId'],
          productName: data['productName'],
          lastMessage: data['lastMessage'],
          lastMessageTime: data['lastMessageTime']?.toDate() || new Date(),
          unreadCount: data['unreadCount'] || 0,
          status: data['status'] || 'active',
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        });
      });

      return conversations;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return [];
    }
  }

  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(
        doc(this.firestore, 'conversations', conversationId),
        updateData
      );
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la conversation:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors de la mise à jour',
      };
    }
  }

  // ==================== MESSAGES ====================

  // ==================== MESSAGES ====================

  async sendMessage(
    messageData: Omit<Message, 'id'>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageWithTimestamp = {
        ...messageData,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(this.firestore, 'messages'),
        messageWithTimestamp
      );

      // Mettre à jour la conversation - CORRECTION ICI
      // D'abord, récupérer la conversation actuelle
      const conversationRef = doc(
        this.firestore,
        'conversations',
        messageData.conversationId
      );
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data();
        const currentUnreadCount = conversationData['unreadCount'] || 0;

        // Calculer le nouveau nombre de messages non lus
        let newUnreadCount = currentUnreadCount;
        if (messageData.senderRole === 'buyer') {
          // Si c'est l'acheteur qui envoie, incrémenter pour le producteur
          newUnreadCount = currentUnreadCount + 1;
        } else {
          // Si c'est le producteur qui envoie, remettre à 0 (messages lus)
          newUnreadCount = 0;
        }

        await updateDoc(conversationRef, {
          lastMessage: messageData.content,
          lastMessageTime: serverTimestamp(),
          unreadCount: newUnreadCount, // Ici on utilise un nombre, pas increment()
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true, messageId: docRef.id };
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Erreur lors de l'envoi du message",
      };
    }
  }

  // ==================== MARQUER LES MESSAGES COMME LUS ====================

  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(
        collection(this.firestore, 'messages'),
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(this.firestore);

      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      if (querySnapshot.size > 0) {
        await batch.commit();

        // Mettre à jour le compteur de messages non lus dans la conversation
        const conversationRef = doc(
          this.firestore,
          'conversations',
          conversationId
        );
        await updateDoc(conversationRef, {
          unreadCount: 0,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors du marquage des messages comme lus',
      };
    }
  }
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const q = query(
        collection(this.firestore, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          conversationId: data['conversationId'],
          senderId: data['senderId'],
          senderName: data['senderName'],
          senderRole: data['senderRole'],
          content: data['content'],
          timestamp: data['timestamp']?.toDate() || new Date(),
          read: data['read'] || false,
          type: data['type'] || 'text',
          metadata: data['metadata'],
        });
      });

      return messages;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }
  }

  // ==================== UTILS ====================

  private getAvatarForName(name: string): string {
    const avatars = ['👨🏾', '👩🏾', '👨🏾', '👩🏾', '👨🏾', '👩🏾'];
    const hash = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatars[hash % avatars.length];
  }

  async startConversationWithBuyer(
    buyerId: string,
    buyerName: string,
    producerId: string,
    producerName: string,
    productId?: string,
    productName?: string
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      // Vérifier si une conversation existe déjà
      const q = query(
        collection(this.firestore, 'conversations'),
        where('buyerId', '==', buyerId),
        where('producerId', '==', producerId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingConv = querySnapshot.docs[0];
        return { success: true, conversationId: existingConv.id };
      }

      // Créer une nouvelle conversation
      const conversationData: Omit<
        Conversation,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        buyerId,
        buyerName,
        buyerAvatar: this.getAvatarForName(buyerName),
        producerId,
        producerName,
        productId,
        productName,
        lastMessage: 'Conversation démarrée',
        lastMessageTime: new Date(),
        unreadCount: 0,
        status: 'active',
      };

      return await this.createConversation(conversationData);
    } catch (error: any) {
      console.error('Erreur lors du démarrage de la conversation:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors du démarrage de la conversation',
      };
    }
  }

  // Écoute en temps réel des messages
  subscribeToConversationMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const q = query(
      collection(this.firestore, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          conversationId: data['conversationId'],
          senderId: data['senderId'],
          senderName: data['senderName'],
          senderRole: data['senderRole'],
          content: data['content'],
          timestamp: data['timestamp']?.toDate() || new Date(),
          read: data['read'] || false,
          type: data['type'] || 'text',
          metadata: data['metadata'],
        });
      });
      callback(messages);
    });

    return unsubscribe;
  }
  // ==================== PRODUCTEURS DISPONIBLES ====================

  async getAvailableProducers(): Promise<any[]> {
    try {
      const q = query(
        collection(this.firestore, 'users'),
        where('role', '==', 'producer'),
        where('reputation', '>=', 0) // Seuls les producteurs avec réputation
      );

      const querySnapshot = await getDocs(q);
      const producers: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        producers.push({
          id: doc.id,
          name: data['fullName'] || data['displayName'] || 'Producteur',
          farmName: data['farmName'] || data['businessName'] || 'Ferme',
          avatar: data['avatar'] || this.getAvatarForName(data['fullName']),
          location: data['location'] || 'Sénégal',
          rating: data['rating'] || data['reputation'] || 4.5,
          reviews: data['reviewCount'] || data['totalReviews'] || 0,
          description: data['description'] || data['bio'] || 'Producteur local',
          phone: data['phone'] || '',
          email: data['email'] || '',
          certifications: data['certifications'] || [],
          isOrganic: data['isOrganic'] || false,
          createdAt: data['createdAt']?.toDate() || new Date(),
        });
      });

      console.log(`${producers.length} producteurs récupérés`);
      return producers;
    } catch (error) {
      console.error('Erreur lors de la récupération des producteurs:', error);
      return [];
    }
  }

  // ==================== SIGNALEMENT ====================

  async reportConversation(
    conversationId: string,
    reporterId: string,
    reason: string,
    additionalInfo?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const reportData = {
        conversationId,
        reporterId,
        reason,
        additionalInfo,
        status: 'pending',
        createdAt: serverTimestamp(),
        resolvedAt: null,
      };

      await addDoc(collection(this.firestore, 'reports'), reportData);

      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors du signalement:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors du signalement',
      };
    }
  }

  // ==================== BLOCAGE ====================

  async blockUser(
    blockerId: string,
    blockedUserId: string,
    blockedUserRole: 'producer' | 'buyer'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const blockData = {
        blockerId,
        blockedUserId,
        blockedUserRole,
        blockedAt: serverTimestamp(),
        status: 'active',
      };

      await addDoc(collection(this.firestore, 'blocks'), blockData);

      // Mettre à jour le statut des conversations existantes
      await this.updateConversationsAfterBlock(blockerId, blockedUserId);

      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors du blocage:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) || 'Erreur lors du blocage',
      };
    }
  }

  private async updateConversationsAfterBlock(
    blockerId: string,
    blockedUserId: string
  ): Promise<void> {
    try {
      // Trouver toutes les conversations entre ces deux utilisateurs
      const q = query(
        collection(this.firestore, 'conversations'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(this.firestore);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isConversationBetweenUsers =
          (data['buyerId'] === blockerId &&
            data['producerId'] === blockedUserId) ||
          (data['buyerId'] === blockedUserId &&
            data['producerId'] === blockerId);

        if (isConversationBetweenUsers) {
          batch.update(doc.ref, {
            status: 'blocked',
            updatedAt: serverTimestamp(),
          });
        }
      });

      if (querySnapshot.size > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des conversations:', error);
    }
  }

  // ==================== GESTION DES PRODUCTEURS (pour acheteur) ====================

  async getProducerDetails(producerId: string): Promise<any> {
    try {
      const producerDoc = await getDoc(
        doc(this.firestore, 'users', producerId)
      );

      if (producerDoc.exists()) {
        const data = producerDoc.data();

        // Récupérer les statistiques du producteur
        const productsCount = await this.getProducerProductsCount(producerId);
        const averageRating = await this.getProducerAverageRating(producerId);

        return {
          id: producerDoc.id,
          name: data['fullName'] || data['displayName'] || 'Producteur',
          farmName:
            data['farmName'] || data['businessName'] || 'Ferme familiale',
          avatar: data['avatar'] || this.getAvatarForName(data['fullName']),
          location: data['location'] || 'Sénégal',
          phone: data['phone'] || '',
          email: data['email'] || '',
          description:
            data['description'] || data['bio'] || 'Producteur local passionné',
          certifications: data['certifications'] || [],
          isOrganic: data['isOrganic'] || false,
          yearsExperience: data['yearsExperience'] || 0,
          deliveryAreas: data['deliveryAreas'] || [],
          productsCount,
          averageRating: averageRating || data['rating'] || 4.5,
          totalReviews: data['reviewCount'] || 0,
          createdAt: data['createdAt']?.toDate() || new Date(),
          socialLinks: data['socialLinks'] || {},
        };
      }

      return null;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des détails du producteur:',
        error
      );
      return null;
    }
  }

  private async getProducerProductsCount(producerId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, 'products'),
        where('producerId', '==', producerId),
        where('status', '==', 'available'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Erreur lors du comptage des produits:', error);
      return 0;
    }
  }

  private async getProducerAverageRating(
    producerId: string
  ): Promise<number | null> {
    try {
      const q = query(
        collection(this.firestore, 'reviews'),
        where('producerId', '==', producerId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      let totalRating = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalRating += data['rating'] || 0;
      });

      return totalRating / querySnapshot.size;
    } catch (error) {
      console.error('Erreur lors du calcul de la note moyenne:', error);
      return null;
    }
  }

  // ==================== DÉMARRER UNE CONVERSATION AVEC MESSAGE INITIAL ====================

  async startConversationWithBuyerAndMessage(
    buyerId: string,
    buyerName: string,
    producerId: string,
    producerName: string,
    initialMessage: string,
    productId?: string, // Ce paramètre est optionnel
    productName?: string // Ce paramètre est optionnel
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      // Vérifier si une conversation existe déjà
      const q = query(
        collection(this.firestore, 'conversations'),
        where('buyerId', '==', buyerId),
        where('producerId', '==', producerId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);

      let conversationId: string;

      if (!querySnapshot.empty) {
        // Conversation existante
        const existingConv = querySnapshot.docs[0];
        conversationId = existingConv.id;

        // Envoyer le message initial
        await this.sendMessage({
          conversationId,
          senderId: buyerId,
          senderName: buyerName,
          senderRole: 'buyer',
          content: initialMessage,
          timestamp: new Date(),
          read: false,
          type: 'text',
        });
      } else {
        // Créer une nouvelle conversation - CORRECTION ICI
        const conversationData: any = {
          buyerId,
          buyerName,
          buyerAvatar: this.getAvatarForName(buyerName),
          producerId,
          producerName,
          producerAvatar: this.getAvatarForName(producerName),
          // N'inclure productId et productName que s'ils sont définis
          ...(productId && { productId }),
          ...(productName && { productName }),
          lastMessage: initialMessage,
          lastMessageTime: new Date(),
          unreadCount: 1,
          status: 'active',
        };

        const result = await this.createConversation(conversationData);

        if (!result.success || !result.conversationId) {
          return result;
        }

        conversationId = result.conversationId;

        // Envoyer le message initial
        await this.sendMessage({
          conversationId,
          senderId: buyerId,
          senderName: buyerName,
          senderRole: 'buyer',
          content: initialMessage,
          timestamp: new Date(),
          read: false,
          type: 'text',
        });
      }

      return { success: true, conversationId };
    } catch (error: any) {
      console.error(
        'Erreur lors du démarrage de la conversation avec message:',
        error
      );
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors du démarrage de la conversation',
      };
    }
  }

  // ==================== VÉRIFICATION DES BLOQUAGES ====================

  async checkIfUserIsBlocked(
    userId: string,
    otherUserId: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, 'blocks'),
        where('blockerId', '==', userId),
        where('blockedUserId', '==', otherUserId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification du blocage:', error);
      return false;
    }
  }

  // ==================== RECHERCHE AVANCÉE DE PRODUCTEURS ====================

  async searchProducers(searchParams: {
    location?: string;
    certifications?: string[];
    isOrganic?: boolean;
    minRating?: number;
    searchTerm?: string;
  }): Promise<any[]> {
    try {
      // Base query pour les producteurs
      let q = query(
        collection(this.firestore, 'users'),
        where('role', '==', 'producer')
      );

      const querySnapshot = await getDocs(q);
      const producers: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Filtrage côté client (pour des filtres plus avancés, utilisez une autre solution)
        let includeProducer = true;

        if (searchParams.location && data['location']) {
          includeProducer = data['location']
            .toLowerCase()
            .includes(searchParams.location.toLowerCase());
        }

        if (
          searchParams.certifications &&
          searchParams.certifications.length > 0
        ) {
          const producerCerts = data['certifications'] || [];
          includeProducer =
            includeProducer &&
            searchParams.certifications.some((cert) =>
              producerCerts.includes(cert)
            );
        }

        if (searchParams.isOrganic !== undefined) {
          includeProducer =
            includeProducer && data['isOrganic'] === searchParams.isOrganic;
        }

        if (searchParams.searchTerm) {
          const searchLower = searchParams.searchTerm.toLowerCase();
          includeProducer =
            includeProducer &&
            ((data['fullName'] || '').toLowerCase().includes(searchLower) ||
              (data['farmName'] || '').toLowerCase().includes(searchLower) ||
              (data['description'] || '').toLowerCase().includes(searchLower));
        }

        if (includeProducer) {
          producers.push({
            id: doc.id,
            name: data['fullName'] || 'Producteur',
            farmName: data['farmName'] || 'Ferme',
            avatar: data['avatar'] || this.getAvatarForName(data['fullName']),
            location: data['location'] || 'Sénégal',
            rating: data['rating'] || data['reputation'] || 4.5,
            reviews: data['reviewCount'] || 0,
            description: data['description'] || 'Producteur local',
            certifications: data['certifications'] || [],
            isOrganic: data['isOrganic'] || false,
          });
        }
      });

      // Filtrer par note minimale
      if (searchParams.minRating) {
        return producers.filter((p) => p.rating >= searchParams.minRating!);
      }

      return producers;
    } catch (error) {
      console.error('Erreur lors de la recherche de producteurs:', error);
      return [];
    }
  }

  // ==================== MÉTHODES D'UTILITÉ SUPPLEMENTAIRES ====================

  async getConversationById(
    conversationId: string
  ): Promise<Conversation | null> {
    try {
      const conversationDoc = await getDoc(
        doc(this.firestore, 'conversations', conversationId)
      );

      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        return {
          id: conversationDoc.id,
          buyerId: data['buyerId'],
          buyerName: data['buyerName'],
          buyerAvatar:
            data['buyerAvatar'] || this.getAvatarForName(data['buyerName']),
          producerId: data['producerId'],
          producerName: data['producerName'],
          productId: data['productId'],
          productName: data['productName'],
          lastMessage: data['lastMessage'],
          lastMessageTime: data['lastMessageTime']?.toDate() || new Date(),
          unreadCount: data['unreadCount'] || 0,
          status: data['status'] || 'active',
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération de la conversation:',
        error
      );
      return null;
    }
  }

  async getUnreadConversationsCount(
    userId: string,
    userRole: 'producer' | 'buyer'
  ): Promise<number> {
    try {
      const fieldToCheck = userRole === 'producer' ? 'producerId' : 'buyerId';

      const q = query(
        collection(this.firestore, 'conversations'),
        where(fieldToCheck, '==', userId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);

      let totalUnread = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalUnread += data['unreadCount'] || 0;
      });

      return totalUnread;
    } catch (error) {
      console.error(
        'Erreur lors du comptage des conversations non lues:',
        error
      );
      return 0;
    }
  }

  // ==================== GESTION DES FAVORIS ====================

  async addProducerToFavorites(
    buyerId: string,
    producerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const favoriteData = {
        buyerId,
        producerId,
        addedAt: serverTimestamp(),
      };

      await addDoc(collection(this.firestore, 'favorites'), favoriteData);
      return { success: true };
    } catch (error: any) {
      console.error("Erreur lors de l'ajout aux favoris:", error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Erreur lors de l'ajout aux favoris",
      };
    }
  }

  async removeProducerFromFavorites(
    buyerId: string,
    producerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(
        collection(this.firestore, 'favorites'),
        where('buyerId', '==', buyerId),
        where('producerId', '==', producerId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(this.firestore);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la suppression des favoris:', error);
      return {
        success: false,
        error:
          this.getFirebaseErrorMessage(error.code) ||
          'Erreur lors de la suppression des favoris',
      };
    }
  }

  async getFavoriteProducers(buyerId: string): Promise<any[]> {
    try {
      const q = query(
        collection(this.firestore, 'favorites'),
        where('buyerId', '==', buyerId)
      );

      const querySnapshot = await getDocs(q);
      const producerIds: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        producerIds.push(data['producerId']);
      });

      if (producerIds.length === 0) return [];

      // Récupérer les détails des producteurs favoris
      const producers: any[] = [];
      for (const producerId of producerIds) {
        const producer = await this.getProducerDetails(producerId);
        if (producer) {
          producers.push(producer);
        }
      }

      return producers;
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return [];
    }
  }
}
