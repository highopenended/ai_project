import { Link } from 'react-router-dom';

function Navbar() {

    return (
        <nav>
            <Link  to="/">Login </Link>
            <Link  to="/home">Home </Link>
            <Link to="/about">About </Link>
            <Link to="/private">Private </Link>
        </nav>
    );
}
export default Navbar