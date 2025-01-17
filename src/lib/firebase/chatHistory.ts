import { db } from '../../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  lastAccessed: number;
  title: string;
}

export const saveConversation = async (userId: string, messages: ChatMessage[]) => {
  console.log('🔥 Starting save:', { userId, messageCount: messages.length });

  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const conversationsRef = collection(db, 'conversations');
    const title = messages[0]?.content.substring(0, 30) + '...';
    
    const newConversation = {
      userId,
      messages,
      lastAccessed: Date.now(),
      title,
      createdAt: Date.now()
    };

    console.log('🔥 Attempting save:', newConversation);
    const docRef = await addDoc(conversationsRef, newConversation);
    console.log('🔥 Save successful:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('🚨 Save failed:', error);
    if (error instanceof Error) {
      console.error('🚨 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
};

export const getUserConversations = async (userId: string) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastAccessed', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Conversation[];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const updateConversation = async (
  conversationId: string,
  messages: ChatMessage[]
) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      messages,
      lastAccessed: Date.now()
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}; 