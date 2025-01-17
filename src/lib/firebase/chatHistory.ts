import { db } from '../../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
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
  console.log('Saving conversation for user:', userId); // Debug
  console.log('Messages to save:', messages); // Debug
  
  try {
    const conversationsRef = collection(db, 'conversations');
    const title = messages[0]?.content.substring(0, 30) + '...';
    
    const newConversation = {
      userId,
      messages,
      lastAccessed: Date.now(),
      title
    };

    console.log('Conversation object to save:', newConversation); // Debug

    const docRef = await addDoc(conversationsRef, newConversation);
    console.log('Successfully saved with ID:', docRef.id); // Debug
    return docRef.id;
  } catch (error) {
    console.error('Detailed save error:', error); // More detailed error
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