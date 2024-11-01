import { useState } from "react";
import '../../App.css';
import { useAuth } from "../../context/AuthContext";

function Home() {
    const { currentUser } = useAuth();
    const [question, setQuestion] = useState("");
    const [questionWithParams, setquestionWithParams] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const questionLead = `Answer this question with the following parameters:
    1) Answer through the lens of a Pathfinder 2e setting
    2) Try to keep the text clean and readable with line breaks
    3) Restrict the response to fit within the maximum number of tokens
    4) Don't say the words "Pathfinder 2e"( ex. any broad sweeping statements can refer to the world of Golorian)`;

    const assignQuestion = (qst) => {
        setQuestion(qst);
        let val = String(`${questionLead}  ${qst}`);
        setquestionWithParams(val);

        // console.log(question);
        // console.log(questionWithParams);
    };

    // Replace with your Firebase Function URL
    const firebaseFunctionUrl = "https://us-central1-project-dm-helper.cloudfunctions.net/chat";

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
                body: JSON.stringify({ question: questionWithParams }),
            });
            const data = await response.json();
            console.log(data.answer);

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
                {/* Only display the email if currentUser exists */}
                {currentUser ? `Logged in as ${currentUser.email}` : "Not logged in"}
            </p>
            <div className="bg-gray-800 p-10 rounded-lg shadow-xl border border-gray-600 w-full max-w-2xl">
                <h1 className="text-2xl font-medieval text-center text-gray-200 mb-6 tracking-wider">
                    Ask the Oracle
                </h1>
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
                {answer && (
                    <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-md max-h-64 overflow-y-auto">
                        <h2 className="text-xl font-medieval text-gray-300 mb-2">Oracle&apos;s Answer:</h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{answer}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
