import { useState } from "react";
import '../../App.css';
import { useAuth } from "../../context/AuthContext";
import { saveConversation, updateConversation } from "../../lib/firebase/chatHistory";

function Home() {
    const { currentUser } = useAuth();
    const [question, setQuestion] = useState("");
    const [questionWithParams, setquestionWithParams] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);

    const questionLead = `You are a professional Dungeon Master. Answer this question with the following parameters:
    1) Answer through the lens of a Pathfinder 2e setting
    2) Try to keep the text clean and readable with line breaks
    3) Restrict the response to fit within the maximum number of tokens
    4) Don't say the words "Pathfinder 2e"( ex. any broad sweeping statements can refer to the world of Golorian)
    5) Be concise and don't speak too broadly`;

    const assignQuestion = (qst) => {
        setQuestion(qst);
        let val = String(`${questionLead}  ${qst}`);
        setquestionWithParams(val);

        // console.log(question);
        // console.log(questionWithParams);
    };

    // Replace with your Firebase Function URL
    const firebaseFunctionUrl = "https://us-central1-project-dm-helper.cloudfunctions.net/chat";

    const handleNewThread = () => {
        setCurrentConversationId(null);
        setMessages([]);
        setQuestion("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create the new user message
            const userMessage = {
                role: 'user',
                content: question,
                timestamp: Date.now()
            };

            // Include all previous messages plus the new question when asking the AI
            const conversationHistory = [...messages, userMessage];
            
            console.log(conversationHistory)


            // Send the full conversation history to the AI
            const response = await fetch(firebaseFunctionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    messages: conversationHistory.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    question: questionWithParams 
                }),
            });



            
            const data = await response.json();

            console.log(data)
            
            // Create the AI's response message
            const assistantMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now()
            };

            // Update the conversation with both messages
            const updatedMessages = [...messages, userMessage, assistantMessage];
            setMessages(updatedMessages);

            if (currentConversationId) {
                await updateConversation(currentConversationId, updatedMessages);
            } else {
                const newConversationId = await saveConversation(currentUser.uid, updatedMessages);
                setCurrentConversationId(newConversationId);
            }

            setQuestion(""); // Clear input after sending
        } catch (error) {
            console.error("Error:", error);
            setQuestion("There was an error processing your question. Please try again.");
        }
        setLoading(false);
    };

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
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval" htmlFor="question">
                            Your Question
                        </label>
                        <textarea
                            id="question"
                            placeholder="Type your question here..."
                            value={question}
                            onChange={(e) => assignQuestion(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400 resize-none"
                            rows="4" // You can adjust this to control the default height
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
                    <div className="mt-6 space-y-4">
                        {[...messages].reverse().map((message, index) => (
                            <div
                                key={index}
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
