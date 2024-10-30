import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./components/pages/Login";
import Home from "./components/pages/Home";
import About from "./components/pages/About";
import Private from "./components/pages/Private";

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/private" element={<Private />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
