import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveConversation, updateConversation } from '../lib/firebase/chatHistory';

function AIChat({ initialMessages = [], conversationId = null }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Add this useEffect to verify currentUser
    useEffect(() => {
        console.log('AIChat mounted, currentUser:', currentUser?.uid);
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submit triggered');

        if (!input.trim() || !currentUser) {
            console.log('Validation failed:', { input: input.trim(), currentUser: !!currentUser });
            return;
        }

        setIsLoading(true);
        const userMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        console.log('Created user message:', userMessage);
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');

        try {
            // Get AI response
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            });

            const data = await response.json();
            console.log('Received AI response:', data);

            const assistantMessage = {
                role: 'assistant',
                content: data.message,
                timestamp: Date.now()
            };

            const newMessages = [...updatedMessages, assistantMessage];
            setMessages(newMessages);

            // Save to Firebase
            console.log('=== ATTEMPTING FIREBASE SAVE ===');
            console.log('User ID:', currentUser.uid);
            console.log('Messages:', newMessages);

            try {
                if (conversationId) {
                    console.log('Updating conversation:', conversationId);
                    await updateConversation(conversationId, newMessages);
                    console.log('Update successful');
                } else {
                    console.log('Creating new conversation');
                    const newId = await saveConversation(currentUser.uid, newMessages);
                    console.log('Save successful, new ID:', newId);
                }
            } catch (saveError) {
                console.error('Firebase save error:', saveError);
                throw saveError;
            }

        } catch (error) {
            console.error('Error in handleSubmit:', error);
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