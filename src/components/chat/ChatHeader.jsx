import PropTypes from 'prop-types';
import '../../styles/Home.css';

function ChatHeader({ onNewThread }) {
    return (
        <div className="header-container">
            <h1 className="chat-title">
                Ask the Oracle
            </h1>
            <button
                onClick={onNewThread}
                className="new-thread-btn"
            >
                New Thread
            </button>
        </div>
    );
}

ChatHeader.propTypes = {
    onNewThread: PropTypes.func.isRequired
};

export default ChatHeader;
