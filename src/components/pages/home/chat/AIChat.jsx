import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { saveConversation, updateConversation } from '../../../../lib/firebase/chatHistory';
import PropTypes from 'prop-types';
import './AIChat.css';

function AIChat({ initialMessages = [], conversationId = null }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(conversationId);

    useEffect(() => {
        setMessages(initialMessages);
        setCurrentConversationId(conversationId);
    }, [initialMessages, conversationId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || !currentUser) {
            console.warn('Missing input or user:', { input: input.trim(), userId: currentUser?.uid });
            return;
        }

        setIsLoading(true);
        const userMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        try {
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setInput('');

            let conversationRef = currentConversationId;
            
            if (!conversationRef) {
                if (!currentUser.email) {
                    throw new Error('User email is required');
                }
                conversationRef = await saveConversation(
                    currentUser.uid, 
                    updatedMessages,
                    currentUser.email
                );
                setCurrentConversationId(conversationRef);
            } else {
                await updateConversation(currentUser.uid, conversationRef, updatedMessages);
            }

            // Get AI response
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            });

            const data = await response.json();
            
            const newMessages = [...updatedMessages, {
                role: 'assistant',
                content: data.message,
                timestamp: Date.now()
            }];
            
            setMessages(newMessages);
            
            // Update conversation with AI response
            if (conversationRef) {
                await updateConversation(currentUser.uid, conversationRef, newMessages);
            }
        } catch (error) {
            console.error('Error in chat flow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chat-container">
            <div className="messages-area">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`message-wrapper ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div className={message.role === 'user' ? 'user-message' : 'assistant-message'}>
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="loading-message">Thinking...</div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="chat-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="chat-input"
                    placeholder="Type your message..."
                />
                <button 
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="chat-submit"
                >
                    Send
                </button>
            </form>
        </div>
    );
}

AIChat.propTypes = {
    initialMessages: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired
    })),
    conversationId: PropTypes.string
};

export default AIChat; 