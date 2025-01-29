import PropTypes from 'prop-types';
import FormattedMessage from './FormattedMessage';
import './MessageList.css';

function MessageList({ messages, conversationId, loading }) {
    return (
        <div className="messages-container">
            {loading ? (
                <div className="loading-messages">Loading conversation...</div>
            ) : messages.length > 0 ? (
                <div className="messages-wrapper">
                    {messages.map((message, index) => (
                        <div
                            key={`${conversationId}-${index}`}
                            className={`message-wrapper ${
                                message.role === 'user' 
                                    ? 'justify-end' 
                                    : 'justify-start'
                            }`}
                        >
                            <FormattedMessage 
                                content={message.content}
                                role={message.role}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-messages">No messages yet</div>
            )}
        </div>
    );
}

MessageList.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired
    })).isRequired,
    conversationId: PropTypes.string,
    loading: PropTypes.bool
};

export default MessageList; 