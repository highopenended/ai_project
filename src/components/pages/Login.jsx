import '../../App.css';
import {signInWithEmailAndPassword }

function Login() {
    return (
        <div className="flex flex-col items-center justify-center bg-gray-900">
            {/* Login Form */}
            <div className="bg-gray-800 p-10 rounded-lg shadow-xl border border-gray-600 w-full max-w-lg h-full max-h-[600px] flex flex-col justify-center">
                <h1 className="text-3xl font-medieval text-center text-gray-200 mb-6 tracking-wider">
                    Enter the Realm
                </h1>
                <form className="space-y-6">
                    <div>
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval" htmlFor="uname">
                            Adventurer's Name
                        </label>
                        <input
                            type="text"
                            id="uname"
                            placeholder="Enter your name, hero"
                            name="uname"
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 font-semibold mb-2 font-medieval" htmlFor="password">
                            Secret Incantation
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            name="password"
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-200 placeholder-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gray-600 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-md transition duration-300 border border-gray-500 shadow-inner tracking-wide font-medieval"
                    >
                        Begin Quest
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
