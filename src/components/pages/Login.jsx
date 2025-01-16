import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import '../../App.css';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isNewAccount, setIsNewAccount] = useState(false);
    
    const navigate = useNavigate(); // Initialize navigate

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        const provider = new GoogleAuthProvider();
        
        try {
            await signInWithPopup(auth, provider);
            console.log("Google sign-in successful");
            navigate('/home');
        } catch (err) {
            setError("Failed to sign in with Google. Please try again.");
            console.error("Google sign-in error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isNewAccount) {
                await createUserWithEmailAndPassword(auth, email, password);
                console.log("Account created successfully");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful");
            }
            navigate('/home');
        } catch (err) {
            setError(isNewAccount 
                ? "Failed to create account. Email may be in use." 
                : "Failed to log in. Please check your email and password.");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-10 rounded-lg shadow-xl border border-gray-600 w-full max-w-lg">
                <h1 className="text-3xl font-medieval text-center text-gray-200 mb-6 tracking-wider">
                    {isNewAccount ? "Join the Realm" : "Enter the Realm"}
                </h1>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full mb-6 bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-300 border shadow-inner tracking-wide font-medieval flex items-center justify-center"
                >
                    <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        className="w-5 h-5 mr-2"
                    />
                    Continue with Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400 font-medieval">Or</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval" htmlFor="password">
                            Hidden Passphrase
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-md transition duration-300 border border-gray-500 shadow-inner tracking-wide font-medieval"
                    >
                        {loading ? "Entering Realm..." : "Begin Quest"}
                    </button>
                    {error && <p className="mt-4 text-red-500 text-center font-medieval">{error}</p>}
                </form>

                <div className="mt-4 text-center text-gray-400 font-medieval">
                    <button
                        onClick={() => setIsNewAccount(!isNewAccount)}
                        className="hover:text-gray-300 transition duration-300"
                    >
                        {isNewAccount 
                            ? "Already have an account? Sign in instead" 
                            : "New to the realm? Create an account"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
