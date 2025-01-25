import PropTypes from 'prop-types';
import '../../styles/Home.css';
import FormattedMessage from './FormattedMessage';

function MessageList({ messages, conversationId }) {
    return (
        <div className="messages-container">
            <div style={{ marginTop: 'auto' }}>
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