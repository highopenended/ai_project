import PropTypes from 'prop-types';
import '../../styles/Home.css';

function MessageList({ messages, conversationId }) {
    return (
        <div className="messages-container">
            {messages.map((message, index) => (
                <div
                    key={`${conversationId}-${index}`}
                    className={`message ${
                        message.role === 'user' 
                            ? 'user-message' 
                            : 'assistant-message'
                    }`}
                >
                    {message.content}
                </div>
            ))}
        </div>
    );
}

MessageList.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired
    })).isRequired,
    conversationId: PropTypes.string
};

export default MessageList; 