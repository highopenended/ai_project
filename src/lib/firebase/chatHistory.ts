import { db } from '../../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  orderBy,
  doc,
  updateDoc,
  setDoc,
  increment,
  deleteDoc,
  writeBatch
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

export const saveConversation = async (userId: string, messages: ChatMessage[], userEmail: string) => {
  console.log('🔥 Starting save with db:', !!db, {
    userId,
    messageCount: messages.length,
    userEmail,
    dbType: db?.type,
    dbConfig: db?.toJSON?.()
  });

  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const conversationsRef = collection(db, 'users', userId, 'conversations');
    console.log('Created reference:', conversationsRef.path);

    // Generate title if we have at least 2 messages (user question + AI response)
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
        // Fallback to first message if title generation fails
        title = messages[0]?.content.substring(0, 100);
      }
    }

    const simpleConversation = {
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

    console.log('Attempting to save:', simpleConversation);
    const docRef = await addDoc(conversationsRef, simpleConversation);
    console.log('Save successful, new doc ID:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('🚨 Save failed:', {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      path: error?.path,
      userId,
      dbExists: !!db
    });
    throw error;
  }
};

export const getUserConversations = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const conversationsRef = collection(userDocRef, 'conversations');
    
    const q = query(
      conversationsRef,
      orderBy('lastAccessed', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const updateConversation = async (
  userId: string,
  conversationId: string,
  messages: ChatMessage[]
) => {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      'messages': messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      'lastAccessed': Date.now()
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const deleteConversation = async (userId: string, conversationId: string) => {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

export const deleteMultipleConversations = async (userId: string, conversationIds: string[]) => {
  try {
    const batch = writeBatch(db);
    
    conversationIds.forEach(id => {
      const conversationRef = doc(db, 'users', userId, 'conversations', id);
      batch.delete(conversationRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting conversations:', error);
    throw error;
  }
};

export const updateConversationTitle = async (userId: string, conversationId: string, newTitle: string) => {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      'title': newTitle,
      'lastAccessed': Date.now()
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
};

export const updateLastAccessed = async (userId: string, conversationId: string) => {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      'lastAccessed': Date.now()
    });
  } catch (error) {
    console.error('Error updating last accessed:', error);
    throw error;
  }
};

/**
 * Toggles the favorite status of a conversation
 */
export async function toggleConversationFavorite(userId: string, conversationId: string, isFavorite: boolean): Promise<void> {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      favorite: isFavorite
    });
  } catch (error) {
    console.error('Error toggling conversation favorite:', error);
    throw error;
  }
}

/**
 * Enforces the conversation limit by deleting the oldest non-favorite conversations
 */
export async function enforceConversationLimit(userId: string, limit: number = 20): Promise<void> {
  try {
    const conversationsRef = collection(db, 'users', userId, 'conversations');
    const q = query(conversationsRef, orderBy('lastAccessed', 'asc'));
    const snapshot = await getDocs(q);
    
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter out favorite conversations
    const nonFavoriteConversations = conversations.filter(conv => !conv.favorite);
    
    // If we have more than the limit, delete the oldest non-favorite conversations
    const excessCount = conversations.length - limit;
    if (excessCount > 0) {
      const conversationsToDelete = nonFavoriteConversations.slice(0, excessCount);
      
      // Delete each conversation
      const batch = writeBatch(db);
      conversationsToDelete.forEach(conv => {
        const docRef = doc(conversationsRef, conv.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Error enforcing conversation limit:', error);
    throw error;
  }
}