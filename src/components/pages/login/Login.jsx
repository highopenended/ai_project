import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import './Login.css';
import { useAuth } from "../../../context/AuthContext";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isNewAccount, setIsNewAccount] = useState(false);
    
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/home');
        }
    }, [currentUser, navigate]);

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
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">
                    {isNewAccount ? "Join the Realm" : "Enter the Realm"}
                </h1>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="google-button"
                >
                    <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        className="google-icon"
                    />
                    Continue with Google
                </button>

                <div className="divider">
                    <div className="divider-line"></div>
                    <div className="divider-text">
                        <span>Or</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Hidden Passphrase
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? "Entering Realm..." : "Begin Quest"}
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </form>

                <div className="toggle-auth">
                    <button onClick={() => setIsNewAccount(!isNewAccount)}>
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
