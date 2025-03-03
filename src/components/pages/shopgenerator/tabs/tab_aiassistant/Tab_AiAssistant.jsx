import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../../../context/AuthContext';
import './Tab_AiAssistant.css';
import { AI_PROMPTS } from '../../utils/aiConstants';

const defaultFilterMaps = {
    categories: new Map(),
    subcategories: new Map(),
    traits: new Map()
};

function Tab_AiAssistant({
    shopState = {},
    // eslint-disable-next-line no-unused-vars
    filterMaps = defaultFilterMaps,
    inventory = []
}) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState(shopState.aiConversations || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Update messages when shopState.aiConversations changes
    useEffect(() => {
        setMessages(shopState.aiConversations || []);
    }, [shopState.aiConversations]);

    // Function to update parent component with new messages
    const updateParentState = useCallback((newMessages) => {
        if (shopState && typeof shopState.onAiConversationUpdate === 'function') {
            shopState.onAiConversationUpdate(newMessages);
        }
    }, [shopState]);

    // Function to clear chat history
    const handleClearChat = useCallback(() => {
        if (isLoading || isAnalyzing) return;
        
        const emptyMessages = [];
        setMessages(emptyMessages);
        updateParentState(emptyMessages);
    }, [isLoading, isAnalyzing, updateParentState]);

    // Create shop state snapshot for context
    const createShopSnapshot = useCallback(() => {
        return {
            // Shop details
            name: shopState?.name || '',
            keeperName: shopState?.keeperName || '',
            type: shopState?.type || '',
            location: shopState?.location || '',
            description: shopState?.description || '',
            keeperDescription: shopState?.keeperDescription || '',
            
            // Shop parameters
            gold: shopState?.gold || 0,
            levelRange: shopState?.levelRange || { min: 0, max: 0 },
            itemBias: shopState?.itemBias || {},
            rarityDistribution: shopState?.rarityDistribution || {},
            
            // Inventory summary
            inventoryCount: inventory?.length || 0,
            
            // Shop ID for reference
            id: shopState?.id || ''
        };
    }, [shopState, inventory]);

    // Format message content with markdown-like syntax
    const formatContent = (text, role) => {
        if (role === 'user') return text;

        return text
            // First, handle headers
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            
            // Handle section headers (bold text at start of line)
            .replace(/^\*\*(.*?)\*\*$/gm, '<h4>$1</h4>')
            
            // Handle numbered items with bold
            .replace(/^(\d+)\.\s+\*\*(.*?)\*\*(.*)$/gm, '<div class="numbered-item"><span class="number">$1.</span> <strong>$2</strong>$3</div>')
            
            // Handle decimal numbered items (like 4.1, 4.2) - convert to bullet points with indentation
            .replace(/^(\d+)\.(\d+)\.\s+(.*?)$/gm, '<ul class="sub-list"><li><strong>$1.$2</strong> $3</li></ul>')
            
            // Handle regular numbered items
            .replace(/^(\d+)\.\s+(.*?)$/gm, '<div class="numbered-item"><span class="number">$1.</span> $2</div>')
            
            // Handle bullet points
            .replace(/^[-*]\s+(.*?)$/gm, '<ul><li>$1</li></ul>')
            
            // Handle bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            
            // Handle paragraphs (lines that don't match any of the above)
            .replace(/^(?!<[hud]|<strong|<div|$)(.*?)$/gm, '<p>$1</p>')
            
            // Handle horizontal rules
            .replace(/^---+$/gm, '<hr />')
            
            // Handle subseparators
            .replace(/^===+$/gm, '<div class="subseparator"></div>')
            
            // Clean up extra newlines
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    const analyzeShopState = useCallback(async () => {
        if (!currentUser || isLoading || isAnalyzing) return;

        setIsAnalyzing(true);
        try {
            // Create user message for analysis request
            const userMessage = {
                role: 'user',
                content: 'Please analyze my shop and suggest improvements for any missing or incomplete details.',
                timestamp: Date.now()
            };

            // Update messages immediately with user input
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            updateParentState(updatedMessages);

            // Get shop snapshot
            const shopSnapshot = createShopSnapshot();
            
            // Get conversation history
            const conversationHistory = messages.map(m => 
                `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
            ).join('\n');

            // Format the analysis request with shop context
            const userValues = `
Shop Details:
- Name: "${shopSnapshot.name}"
- Type: "${shopSnapshot.type}"
- Keeper: "${shopSnapshot.keeperName}"
- Location: "${shopSnapshot.location}"
- Description: "${shopSnapshot.description}"
- Keeper Description: "${shopSnapshot.keeperDescription}"

Shop Parameters:
- Gold: ${shopSnapshot.gold}
- Level Range: ${shopSnapshot.levelRange.min}-${shopSnapshot.levelRange.max}
- Inventory Count: ${shopSnapshot.inventoryCount} items`;

            // Use the baseContext and fillGapsTemplate from AI_PROMPTS
            const analysisPrompt = `${AI_PROMPTS.baseContext}

${AI_PROMPTS.fillGapsTemplate.replace('{userValues}', userValues).replace('{conversationHistory}', conversationHistory)}

Please format your response with clear headings using **bold text** for section titles and numbered lists for suggestions.`;

            // Get AI response from Firebase function
            const response = await fetch("https://us-central1-project-dm-helper.cloudfunctions.net/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    question: analysisPrompt
                })
            });

            const data = await response.json();
            
            // Create AI response message
            const assistantMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now()
            };

            // Update messages with AI response
            const finalMessages = [...updatedMessages, assistantMessage];
            setMessages(finalMessages);
            updateParentState(finalMessages);
        } catch (err) {
            console.error('Error analyzing shop:', err);
            setError(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [currentUser, isLoading, isAnalyzing, messages, createShopSnapshot, updateParentState]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || !currentUser || isLoading) return;

        setIsLoading(true);
        try {
            // Create user message
            const userMessage = {
                role: 'user',
                content: input.trim(),
                timestamp: Date.now()
            };

            // Update messages immediately with user input
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            updateParentState(updatedMessages);
            setInput('');

            // Get shop snapshot
            const shopSnapshot = createShopSnapshot();
            
            // Get conversation history
            const conversationHistory = messages.map(m => 
                `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
            ).join('\n');

            // Format the question with shop context
            const userValues = `
Shop Details:
- Name: "${shopSnapshot.name}"
- Type: "${shopSnapshot.type}"
- Keeper: "${shopSnapshot.keeperName}"
- Location: "${shopSnapshot.location}"
- Description: "${shopSnapshot.description}"
- Keeper Description: "${shopSnapshot.keeperDescription}"

Shop Parameters:
- Gold: ${shopSnapshot.gold}
- Level Range: ${shopSnapshot.levelRange.min}-${shopSnapshot.levelRange.max}
- Inventory Count: ${shopSnapshot.inventoryCount} items`;

            // Use the baseContext from AI_PROMPTS
            const contextualQuestion = `${AI_PROMPTS.baseContext}

Based on the following shop details:
${userValues}

And considering our previous conversation:
${conversationHistory}

Current question: ${input}

Format your response with clear headings using **bold text** for section titles and bullet points for lists.`;

            // Get AI response from Firebase function
            const response = await fetch("https://us-central1-project-dm-helper.cloudfunctions.net/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    question: contextualQuestion
                })
            });

            const data = await response.json();
            
            // Create AI response message
            const assistantMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now()
            };

            // Update messages with AI response
            const finalMessages = [...updatedMessages, assistantMessage];
            setMessages(finalMessages);
            updateParentState(finalMessages);
        } catch (err) {
            console.error('Error in chat:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="ai-assistant-error">
                <h3>Something went wrong</h3>
                <p>{error.message || "An error occurred while communicating with the AI."}</p>
                <button onClick={() => setError(null)}>Try Again</button>
            </div>
        );
    }

    // Sort messages to show newest first
    const sortedMessages = [...messages].reverse();

    return (
        <div className="ai-assistant-container">
            <div className="ai-assistant-content">
                <h2>Oracle Assistant</h2>
                <div className="ai-assistant-actions">
                    <button 
                        className="analyze-button"
                        onClick={analyzeShopState}
                        disabled={isAnalyzing || isLoading}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Fill in the Gaps'}
                    </button>
                    <button 
                        className="clear-button"
                        onClick={handleClearChat}
                        disabled={isAnalyzing || isLoading || messages.length === 0}
                    >
                        Clear Chat
                    </button>
                </div>
                <div className="ai-assistant-messages">
                    {(isLoading || isAnalyzing) && (
                        <div className="ai-assistant-loading">
                            {isAnalyzing ? 'Analyzing your shop...' : 'Consulting the Oracle...'}
                        </div>
                    )}
                    {messages.length === 0 ? (
                        <div className="ai-assistant-empty">
                            <p>No conversation yet. Ask a question or use &quot;Fill in the Gaps&quot; to get started.</p>
                        </div>
                    ) : (
                        sortedMessages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                            >
                                <div 
                                    className="message-content"
                                    dangerouslySetInnerHTML={{ __html: formatContent(message.content, message.role) }}
                                />
                            </div>
                        ))
                    )}
                </div>
                <form onSubmit={handleSubmit} className="ai-assistant-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the Oracle about your shop..."
                        disabled={isLoading || isAnalyzing}
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || isAnalyzing || !input.trim()}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

Tab_AiAssistant.propTypes = {
    shopState: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        keeperName: PropTypes.string,
        type: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
        keeperDescription: PropTypes.string,
        dateCreated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        dateLastEdited: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        gold: PropTypes.number,
        levelRange: PropTypes.shape({
            min: PropTypes.number,
            max: PropTypes.number,
        }),
        itemBias: PropTypes.object,
        rarityDistribution: PropTypes.object,
        aiConversations: PropTypes.arrayOf(PropTypes.shape({
            role: PropTypes.oneOf(['user', 'assistant']).isRequired,
            content: PropTypes.string.isRequired,
            timestamp: PropTypes.number.isRequired
        })),
        onAiConversationUpdate: PropTypes.func
    }),
    filterMaps: PropTypes.shape({
        categories: PropTypes.instanceOf(Map),
        subcategories: PropTypes.instanceOf(Map),
        traits: PropTypes.instanceOf(Map),
    }),
    inventory: PropTypes.array
};

Tab_AiAssistant.displayName = "The Oracle";
Tab_AiAssistant.minWidth = 250;

export default Tab_AiAssistant;
