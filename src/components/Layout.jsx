// Layout.js
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Assuming you have an AuthContext
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import your Firebase config
import { useNavigate } from "react-router-dom";



// eslint-disable-next-line react/prop-types
function Layout({ children }) {
    const { currentUser } = useAuth(); // Get the current user from context
    const navigate = useNavigate(); // Initialize navigate

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User logged out");
            navigate("/")
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-900">
            {/* Navbar */}
            <nav className="w-full bg-gray-800 py-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex justify-center space-x-8 font-medieval">
                    <Link to="/" className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg">
                        Login
                    </Link>
                    <Link to="/home" className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg">
                        Home
                    </Link>
                    {/* Render Logout button if the user is logged in */}
                    {currentUser && (
                        <button
                            onClick={handleLogout}
                            className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg"
                        >
                            Log Out
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center w-full">
                {children}
            </main>
        </div>
    );
}

export default Layout;
