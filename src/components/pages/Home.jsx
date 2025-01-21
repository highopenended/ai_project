import { useState, useEffect, useRef } from "react";
import '../../App.css';
import { useAuth } from "../../context/AuthContext";
import { saveConversation, updateConversation } from "../../lib/firebase/chatHistory";
import { useLocation, useNavigate } from "react-router-dom";

function Home({ initialMessages = [], conversationId = null }) {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(conversationId);
    const [messages, setMessages] = useState([]);
    const loadingRef = useRef(false);

    const handleNewThread = () => {
        setMessages([]);
        setCurrentConversationId(null);
        setQuestion("");
        navigate('/home', { replace: true, state: {} });
    };

    // Single source of truth for message sorting
    const sortMessages = (msgs) => {
        return [...msgs].sort((a, b) => b.timestamp - a.timestamp);
    };

    useEffect(() => {
        if (loadingRef.current) return;
        
        const loadConversation = async () => {
            const messageData = location.state?.messages || initialMessages;
            const convId = location.state?.conversationId || conversationId;
            
            if (!messageData || messageData.length === 0) {
                setMessages([]);
                setCurrentConversationId(null);
                return;
            }

            try {
                loadingRef.current = true;
                setMessages(sortMessages(messageData));
                setCurrentConversationId(convId);
            } finally {
                loadingRef.current = false;
            }
        };

        loadConversation();
    }, [location.state?.conversationId, conversationId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || !question.trim()) return;
        
        setLoading(true);
        try {
            const userMessage = {
                role: 'user',
                content: question,
                timestamp: Date.now()
            };

            // Add new message to existing messages
            const updatedMessages = sortMessages([...messages, userMessage]);
            setMessages(updatedMessages);
            setQuestion("");

            // Format the question to include context
            const contextualQuestion = `Previous conversation: ${messages.map(m => 
                `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
            ).join('\n')}\n\nCurrent question: ${question}`;

            const payload = { 
                messages: updatedMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                question: `${questionLead}\n\n${contextualQuestion}`
            };

            const response = await fetch(firebaseFunctionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            // After getting AI response
            const assistantMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now()
            };

            // Update with AI response
            const finalMessages = sortMessages([...updatedMessages, assistantMessage]);
            setMessages(finalMessages);

            // Update conversation in Firebase
            if (currentConversationId) {
                await updateConversation(currentUser.uid, currentConversationId, finalMessages);
            } else {
                const newConversationId = await saveConversation(currentUser.uid, finalMessages);
                setCurrentConversationId(newConversationId);
            }
        } catch (error) {
            console.error("Error:", error);
            setQuestion("There was an error processing your question. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const questionLead = `You are a professional Dungeon Master. Answer this question with the following parameters:
    1) Answer through the lens of a Pathfinder 2e setting
    2) Try to keep the text clean and readable with line breaks
    3) Restrict the response to fit within the maximum number of tokens
    4) Don't say the words "Pathfinder 2e"( ex. any broad sweeping statements can refer to the world of Golorian)
    5) Be concise and don't speak too broadly`;

    // Replace with your Firebase Function URL
    const firebaseFunctionUrl = "https://us-central1-project-dm-helper.cloudfunctions.net/chat";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <p className="text-gray-300 text-center mb-4">
                {currentUser ? `Logged in as ${currentUser.email}` : "Not logged in"}
            </p>
            <div className="bg-gray-800 p-10 rounded-lg shadow-xl border border-gray-600 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-medieval text-center text-gray-200 tracking-wider">
                        Ask the Oracle
                    </h1>
                    <button
                        onClick={handleNewThread}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
                    >
                        New Thread
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval">
                            Your Question
                        </label>
                        <textarea
                            id="question"
                            placeholder="Type your question here..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400 resize-none"
                            rows="4"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-md transition duration-300 border border-gray-500 shadow-inner tracking-wide font-medieval"
                    >
                        {loading ? "Consulting..." : "Ask"}
                    </button>
                </form>
                {messages.length > 0 && (
                    <div className="mt-6 space-y-4 flex flex-col">
                        {messages.map((message, index) => (
                            <div
                                key={`${currentConversationId}-${index}`}
                                className={`p-4 rounded-md ${
                                    message.role === 'user' 
                                        ? 'bg-blue-600 text-white ml-auto max-w-[80%]' 
                                        : 'bg-gray-700 text-gray-200 mr-auto max-w-[80%]'
                                }`}
                            >
                                {message.content}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
