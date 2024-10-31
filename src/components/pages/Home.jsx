import { useState } from "react";
import '../../App.css';
import { useAuth } from "../../context/AuthContext";

function Home() {
    const { currentUser } = useAuth();
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    // Replace with your Firebase Function URL
    const firebaseFunctionUrl = "https://<REGION>-<PROJECT_ID>.cloudfunctions.net/chat";

    // Function to handle question submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAnswer(""); // Clear previous answer
        try {
            // Make an API request to your Firebase function
            const response = await fetch(firebaseFunctionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question }),
            });
            const data = await response.json();
            setAnswer(data.answer); // Assuming your backend returns { answer: "..." }
        } catch (error) {
            console.error("Error fetching answer:", error);
            setAnswer("There was an error processing your question. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <p className="text-gray-300 text-center">
                        Logged in as {currentUser.email}
            </p>
            <div className="bg-gray-800 p-10 rounded-lg shadow-xl border border-gray-600 w-full max-w-lg">
                <h1 className="text-2xl font-medieval text-center text-gray-200 mb-6 tracking-wider">
                    Ask the Oracle
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval" htmlFor="question">
                            Your Question
                        </label>
                        <input
                            type="text"
                            id="question"
                            placeholder="Type your question here..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400"
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
                {answer && (
                    <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-md">
                        <h2 className="text-xl font-medieval text-gray-300 mb-2">Oracle&apos;s Answer:</h2>
                        <p className="text-gray-300">{answer}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
