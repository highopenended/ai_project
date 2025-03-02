import { useState } from 'react';
import './Tab_AiAssistant.css';

function Tab_AiAssistant() {
    const [error, setError] = useState(null);

    if (error) {
        return (
            <div className="ai-assistant-error">
                <h3>Something went wrong</h3>
                <p>{error.message}</p>
                <button onClick={() => setError(null)}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="ai-assistant-container">
            <div className="ai-assistant-content">
                <h2>Oracle Assistant</h2>
                <div className="ai-assistant-ready">
                    Ready to assist you with your shop!
                </div>
            </div>
        </div>
    );
}

Tab_AiAssistant.displayName = "The Oracle";
Tab_AiAssistant.minWidth = 250;

export default Tab_AiAssistant;
