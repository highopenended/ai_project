import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserConversations, Conversation, ChatMessage } from '../lib/firebase/chatHistory';
import '../styles/ChatHistory.css';

interface ChatHistoryProps {
  onSelectConversation: (messages: ChatMessage[], conversationId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectConversation }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser) return;
      
      try {
        const userConversations = await getUserConversations(currentUser.uid);
        console.log('Loaded conversations:', userConversations); // Debug log
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  if (loading) {
    return <div className="p-4 text-gray-300">Loading conversations...</div>;
  }

  return (
    <div className="chat-history">
      {conversations.length === 0 ? (
        <div className="p-4 text-gray-300">No conversations yet</div>
      ) : (
        conversations.map((conversation) => (
          <div 
            key={conversation.id}
            className="conversation-preview"
            onClick={() => onSelectConversation(conversation.messages, conversation.id)}
          >
            <h3 className="text-gray-200">{conversation.title || 'Untitled Conversation'}</h3>
            <p className="text-gray-400 text-sm">
              {new Date(conversation.lastAccessed).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatHistory; 