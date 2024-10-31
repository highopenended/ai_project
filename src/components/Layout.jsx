// Layout.js
import { Link } from "react-router-dom";

// eslint-disable-next-line react/prop-types
function Layout({ children }) {
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
                    <Link to="/about" className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg">
                        About
                    </Link>
                    <Link to="/private" className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg">
                        Private
                    </Link>
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
