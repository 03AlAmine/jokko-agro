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
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { environment } from '../../environments/environment';

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'producer' | 'buyer';
  createdAt: Date;
  reputation?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private firestore = getFirestore(this.app);
  private storage = getStorage(this.app);

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

  async register(userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Créer l'utilisateur avec email/password
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );

      // Créer le document utilisateur dans Firestore
      const userDoc: UserData = {
        uid: userCredential.user.uid,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        createdAt: new Date(),
        reputation: userData.role === 'producer' ? 0 : undefined
      };

      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userDoc);
      this.userData = userDoc;

      return { success: true };
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error.code)
      };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error.code)
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

  private async loadUserData(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.userData = {
          uid: data['uid'],
          email: data['email'],
          fullName: data['fullName'],
          phone: data['phone'],
          role: data['role'],
          createdAt: data['createdAt'].toDate(),
          reputation: data['reputation']
        };
        console.log('Données utilisateur chargées:', this.userData);

        // Stocker dans localStorage pour une récupération rapide
        localStorage.setItem('userData', JSON.stringify(this.userData));
      } else {
        console.warn('Document utilisateur non trouvé dans Firestore');
      }
    } catch (error) {
      console.error('Erreur de chargement des données utilisateur:', error);

      // Essayer de récupérer depuis localStorage en cas d'erreur
      const cachedData = localStorage.getItem('userData');
      if (cachedData) {
        this.userData = JSON.parse(cachedData);
        console.log('Données utilisateur restaurées depuis localStorage');
      }
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
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion'
    };

    return errorMessages[code] || 'Une erreur est survenue';
  }

  // Nettoyer le cache
  clearCache() {
    localStorage.removeItem('userData');
  }
}
