import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserConversations } from '../lib/firebase/chatHistory';
import '../styles/ChatHistory.css';
import PropTypes from 'prop-types';

const ChatHistory = ({ onSelectConversation }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('ChatHistory rendering, currentUser:', currentUser); // Debug log

  useEffect(() => {
    console.log('ChatHistory useEffect triggered'); // Debug log
    const loadConversations = async () => {
      if (!currentUser) return;
      try {
        const userConversations = await getUserConversations(currentUser.uid);
        console.log('Loaded conversations:', userConversations);
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
            onClick={() => onSelectConversation(conversation.messageData, conversation.id)}
          >
            <h3 className="text-gray-200">{conversation.metadata.title || 'Untitled Conversation'}</h3>
            <p className="text-gray-400 text-sm">
              {new Date(conversation.metadata.lastAccessed).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

ChatHistory.propTypes = {
  onSelectConversation: PropTypes.func.isRequired
};

export default ChatHistory; 