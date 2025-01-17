import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveConversation, updateConversation, getUserConversations } from '../lib/firebase/chatHistory';

function AIChat({ initialMessages = [], conversationId = null }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(conversationId);

    // Load conversation history when component mounts
    useEffect(() => {
        const loadConversations = async () => {
            if (!currentUser) return;
            
            try {
                console.log('Loading conversations for user:', currentUser.uid);
                const conversations = await getUserConversations(currentUser.uid);
                console.log('Loaded conversations:', conversations);
                
                // If we have a conversationId, load that specific conversation
                if (currentConversationId) {
                    const conversation = conversations.find(c => c.id === currentConversationId);
                    if (conversation) {
                        console.log('Loading specific conversation:', conversation);
                        setMessages(conversation.messages);
                    }
                }
            } catch (error) {
                console.error('Error loading conversations:', error);
            }
        };

        loadConversations();
    }, [currentUser, currentConversationId]);

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

        // Debug log the exact data we're about to save
        const debugData = {
            userId: currentUser.uid,
            message: userMessage,
            timestamp: new Date().toISOString()
        };
        console.log('Attempting to save:', debugData);

        try {
            // Save user message immediately
            let conversationRef = currentConversationId;
            const updatedMessages = [...messages, userMessage];
            
            if (!conversationRef) {
                // Log the exact data being sent to saveConversation
                console.log('Creating new conversation with data:', {
                    userId: currentUser.uid,
                    messages: updatedMessages
                });
                
                conversationRef = await saveConversation(currentUser.uid, updatedMessages);
                console.log('New conversation ID:', conversationRef);
                setCurrentConversationId(conversationRef);
            } else {
                console.log('Updating conversation:', conversationRef);
                await updateConversation(conversationRef, updatedMessages);
            }

            setMessages(updatedMessages);
            setInput('');

            // Get AI response
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            });

            const data = await response.json();
            
            const assistantMessage = {
                role: 'assistant',
                content: data.message,
                timestamp: Date.now()
            };

            const newMessages = [...updatedMessages, assistantMessage];
            setMessages(newMessages);

            // Update with AI response
            if (conversationRef) {
                console.log('Saving AI response to conversation:', conversationRef);
                await updateConversation(conversationRef, newMessages);
            }

        } catch (error) {
            console.error('Error in chat flow:', error);
            // Log detailed error information
            if (error.code) {
                console.error('Firebase error code:', error.code);
            }
            if (error.message) {
                console.error('Error message:', error.message);
            }
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

export default AIChat; 