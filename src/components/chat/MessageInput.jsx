import { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/Home.css';

function MessageInput({ onSubmit, loading }) {
    const [question, setQuestion] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(question);
        setQuestion("");
    };

    return (
        <form onSubmit={handleSubmit} className="question-form">
            <div>
                <label className="question-label">
                    Your Question
                </label>
                <textarea
                    id="question"
                    placeholder="Type your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    className="question-textarea"
                    rows="4"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="submit-btn"
            >
                {loading ? "Consulting..." : "Ask"}
            </button>
        </form>
    );
}

MessageInput.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default MessageInput;