import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveConversation, updateConversation } from '../lib/firebase/chatHistory';
import PropTypes from 'prop-types';

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
            console.log('Current user details:', {
                uid: currentUser.uid,
                email: currentUser.email,
                isAnonymous: currentUser.isAnonymous
            });

            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setInput('');

            let conversationRef = currentConversationId;
            
            console.log('Attempting to save conversation with:', {
                userId: currentUser.uid,
                messageCount: updatedMessages.length,
                email: currentUser.email,
                messages: updatedMessages
            });

            if (!conversationRef) {
                if (!currentUser.email) {
                    throw new Error('User email is required');
                }
                conversationRef = await saveConversation(
                    currentUser.uid, 
                    updatedMessages,
                    currentUser.email
                );
                console.log('New conversation created:', conversationRef);
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
            console.error('Chat error details:', {
                code: error.code,
                message: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 p-4">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-200'
                        }`}>
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="text-gray-400">Thinking...</div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-gray-800 text-gray-200 p-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                    placeholder="Type your message..."
                />
                <button 
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
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