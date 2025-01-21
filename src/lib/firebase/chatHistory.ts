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
  increment
} from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  messageData: ChatMessage[];
  metadata: {
    lastAccessed: number;
    title: string;
    createdAt: number;
    ownerEmail: string;
  };
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

    const simpleConversation = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      lastAccessed: Date.now(),
      title: messages[0]?.content.substring(0, 30) + '...',
      createdAt: Date.now()
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
    // Reference the user's conversations subcollection
    const userDocRef = doc(db, 'users', userId);
    const conversationsRef = collection(userDocRef, 'conversations');
    
    const q = query(
      conversationsRef,
      orderBy('metadata.lastAccessed', 'desc')
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
  userId: string,
  conversationId: string,
  messages: ChatMessage[]
) => {
  try {
    const conversationRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      'messageData': messages,
      'metadata.lastAccessed': Date.now()
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}; 