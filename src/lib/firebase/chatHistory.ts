import { db } from '../../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  DocumentData,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';

const FIREBASE_FUNCTION_BASE_URL = "https://us-central1-project-dm-helper.cloudfunctions.net";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  lastAccessed: number;
  createdAt: number;
  title: string;
  favorite: boolean;
}

type FirestoreConversation = Omit<Conversation, 'id'>;

// Helper functions to create Firestore references
const getConversationsCollection = (userId: string): CollectionReference => {
  return collection(db, 'users', userId, 'conversations');
};

const getConversationDoc = (userId: string, conversationId: string): DocumentReference => {
  return doc(db, 'users', userId, 'conversations', conversationId);
};

// Helper function to map document data to Conversation type
const mapDocToConversation = (doc: DocumentData): Conversation => ({
  id: doc.id,
  messages: doc.data().messages,
  lastAccessed: doc.data().lastAccessed,
  createdAt: doc.data().createdAt,
  title: doc.data().title,
  favorite: doc.data().favorite ?? false
});

export const saveConversation = async (userId: string, messages: ChatMessage[], userEmail: string) => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const conversationsRef = getConversationsCollection(userId);

    // Generate title if we have at least 2 messages
    let title = "New Conversation";
    if (messages.length >= 2) {
      try {
        const response = await fetch(`${FIREBASE_FUNCTION_BASE_URL}/generateTitle`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({ messages: messages.slice(0, 4) })
        });
        
        if (!response.ok) {
          throw new Error('Title generation failed');
        }
        
        const data = await response.json();
        title = data.title;
      } catch (error) {
        console.error('Failed to generate title:', error);
        title = messages[0]?.content.substring(0, 100) || "New Conversation";
      }
    }

    const conversation: FirestoreConversation = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      lastAccessed: Date.now(),
      title,
      createdAt: Date.now(),
      favorite: false
    };

    const docRef = await addDoc(conversationsRef, conversation);
    return docRef.id;

  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const conversationsRef = getConversationsCollection(userId);
    const q = query(conversationsRef, orderBy('lastAccessed', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(mapDocToConversation);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const updateConversation = async (
  userId: string,
  conversationId: string,
  messages: ChatMessage[]
): Promise<void> => {
  try {
    const conversationRef = getConversationDoc(userId, conversationId);
    await updateDoc(conversationRef, {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      lastAccessed: Date.now()
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const deleteConversation = async (userId: string, conversationId: string): Promise<void> => {
  try {
    const conversationRef = getConversationDoc(userId, conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

export const deleteMultipleConversations = async (userId: string, conversationIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    conversationIds.forEach(id => {
      const conversationRef = getConversationDoc(userId, id);
      batch.delete(conversationRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting conversations:', error);
    throw error;
  }
};

export const updateConversationTitle = async (
  userId: string, 
  conversationId: string, 
  newTitle: string
): Promise<void> => {
  try {
    const conversationRef = getConversationDoc(userId, conversationId);
    await updateDoc(conversationRef, {
      title: newTitle,
      lastAccessed: Date.now()
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
};

export const updateLastAccessed = async (userId: string, conversationId: string): Promise<void> => {
  try {
    const conversationRef = getConversationDoc(userId, conversationId);
    await updateDoc(conversationRef, {
      lastAccessed: Date.now()
    });
  } catch (error) {
    console.error('Error updating last accessed:', error);
    throw error;
  }
};

export const toggleConversationFavorite = async (
  userId: string, 
  conversationId: string, 
  isFavorite: boolean
): Promise<void> => {
  try {
    const conversationRef = getConversationDoc(userId, conversationId);
    await updateDoc(conversationRef, {
      favorite: isFavorite
    });
  } catch (error) {
    console.error('Error toggling conversation favorite:', error);
    throw error;
  }
};

export const enforceConversationLimit = async (userId: string, limit: number = 20): Promise<void> => {
  try {
    const conversationsRef = getConversationsCollection(userId);
    const q = query(conversationsRef, orderBy('lastAccessed', 'asc'));
    const snapshot = await getDocs(q);
    
    const conversations = snapshot.docs.map(mapDocToConversation);
    const nonFavoriteConversations = conversations.filter(conv => !conv.favorite);
    
    const excessCount = conversations.length - limit;
    if (excessCount > 0) {
      const conversationsToDelete = nonFavoriteConversations.slice(0, excessCount);
      
      const batch = writeBatch(db);
      conversationsToDelete.forEach(conv => {
        const docRef = getConversationDoc(userId, conv.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Error enforcing conversation limit:', error);
    throw error;
  }
};