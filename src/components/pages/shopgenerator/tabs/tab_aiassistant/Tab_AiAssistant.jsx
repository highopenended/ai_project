import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../../../context/AuthContext';
import './Tab_AiAssistant.css';
import { 
    AI_PROMPTS, 
    LEVEL_MARKERS, 
    NORMAL_RARITY_DISTRIBUTION, 
    NORMAL_GOLD_PER_LEVEL 
} from '../../utils/aiConstants';

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
            
            // Inventory summary (Ignore Inventory for the foreseeable future)
            // inventoryCount: inventory?.length || 0,
            
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

    // Process AI response to format JSON and filter out null values
    const processAIResponse = (response) => {
        try {
            // Log the original response for debugging
            console.log('Original AI Response:', { originalResponse: response });
            
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return response;
            
            const jsonStr = jsonMatch[0];
            const data = JSON.parse(jsonStr);
            
            // If there's no suggestions, return the original response
            if (!data.suggestions) return response;
            
            // Extract reasoning - preserve the full text
            const reasoning = data.reasoning || "Based on the shop details, I've suggested the following improvements:";
            
            // Filter out null values from suggestions
            const suggestions = data.suggestions;
            const filteredSuggestions = {};
            
            // Process basic fields
            const basicFields = ['shopName', 'shopType', 'keeperName', 'location', 'description', 'keeperDescription'];
            basicFields.forEach(field => {
                if (suggestions[field] !== null && suggestions[field] !== undefined) {
                    filteredSuggestions[field] = suggestions[field];
                }
            });
            
            // Process parameters if they exist
            if (suggestions.parameters) {
                const params = {};
                
                // Gold
                if (suggestions.parameters.gold !== null && suggestions.parameters.gold !== undefined) {
                    params.gold = suggestions.parameters.gold;
                }
                
                // Level Range
                if (suggestions.parameters.levelRange) {
                    const levelRange = {};
                    if (suggestions.parameters.levelRange.min !== null && suggestions.parameters.levelRange.min !== undefined) {
                        levelRange.min = suggestions.parameters.levelRange.min;
                    }
                    if (suggestions.parameters.levelRange.max !== null && suggestions.parameters.levelRange.max !== undefined) {
                        levelRange.max = suggestions.parameters.levelRange.max;
                    }
                    if (Object.keys(levelRange).length > 0) {
                        params.levelRange = levelRange;
                    }
                }
                
                // Item Bias
                if (suggestions.parameters.itemBias) {
                    const itemBias = {};
                    if (suggestions.parameters.itemBias.x !== null && suggestions.parameters.itemBias.x !== undefined) {
                        itemBias.variety = suggestions.parameters.itemBias.x;
                    }
                    if (suggestions.parameters.itemBias.y !== null && suggestions.parameters.itemBias.y !== undefined) {
                        itemBias.cost = suggestions.parameters.itemBias.y;
                    }
                    if (Object.keys(itemBias).length > 0) {
                        params.itemBias = itemBias;
                    }
                }
                
                // Rarity Distribution - if any rarity is included, include all four
                if (suggestions.parameters.rarityDistribution) {
                    const rarities = {};
                    const rarityKeys = ['Common', 'Uncommon', 'Rare', 'Unique'];
                    let hasAnyRarity = false;
                    
                    // Check if any rarity is specified
                    rarityKeys.forEach(key => {
                        if (suggestions.parameters.rarityDistribution[key] !== null && 
                            suggestions.parameters.rarityDistribution[key] !== undefined) {
                            hasAnyRarity = true;
                        }
                    });
                    
                    // If any rarity is specified, include all four
                    if (hasAnyRarity) {
                        rarityKeys.forEach(key => {
                            // Use the suggested value or the default from NORMAL_RARITY_DISTRIBUTION
                            rarities[key] = suggestions.parameters.rarityDistribution[key] !== null && 
                                suggestions.parameters.rarityDistribution[key] !== undefined
                                ? suggestions.parameters.rarityDistribution[key]
                                : NORMAL_RARITY_DISTRIBUTION[key];
                        });
                        
                        // Normalize to ensure they sum to 100
                        const sum = Object.values(rarities).reduce((a, b) => a + b, 0);
                        if (sum !== 100) {
                            const factor = 100 / sum;
                            rarityKeys.forEach(key => {
                                rarities[key] = Math.round((rarities[key] * factor) * 100) / 100;
                            });
                        }
                        
                        params.rarityDistribution = rarities;
                    }
                }
                
                if (Object.keys(params).length > 0) {
                    filteredSuggestions.parameters = params;
                }
            }
            
            // Process categories if they exist - only include valid categories
            if (suggestions.categories) {
                const categories = {};
                
                // Only include valid categories that match the ones in the UI
                if (Array.isArray(suggestions.categories.included) && suggestions.categories.included.length > 0) {
                    // We don't have access to the actual category list here, so we'll just pass them through
                    // The UI will filter out invalid ones
                    categories.included = suggestions.categories.included;
                }
                
                if (Array.isArray(suggestions.categories.excluded) && suggestions.categories.excluded.length > 0) {
                    categories.excluded = suggestions.categories.excluded;
                }
                
                if (Object.keys(categories).length > 0) {
                    filteredSuggestions.categories = categories;
                }
            }
            
            // If no suggestions remain after filtering, return a message
            if (Object.keys(filteredSuggestions).length === 0) {
                return "Your shop looks good! I don't have any specific suggestions for improvement.";
            }
            
            // Format the filtered suggestions as a readable message
            let formattedResponse = `**Suggestions**\n\n`;
            
            // Add basic fields
            const fieldLabels = {
                shopName: 'Shop Name',
                shopType: 'Shop Type',
                keeperName: 'Keeper Name',
                location: 'Location',
                description: 'Description',
                keeperDescription: 'Keeper Description'
            };
            
            Object.keys(filteredSuggestions).forEach(key => {
                if (key === 'parameters' || key === 'categories' || key === 'reasoning') return;
                formattedResponse += `- **${fieldLabels[key]}**: ${filteredSuggestions[key]}\n`;
            });
            
            // Add parameters
            if (filteredSuggestions.parameters) {
                formattedResponse += '\n**Parameters**\n';
                
                if (filteredSuggestions.parameters.gold !== undefined) {
                    formattedResponse += `- **Gold**: ${filteredSuggestions.parameters.gold}\n`;
                }
                
                if (filteredSuggestions.parameters.levelRange) {
                    const lr = filteredSuggestions.parameters.levelRange;
                    if (lr.min !== undefined && lr.max !== undefined) {
                        formattedResponse += `- **Level Range**: ${lr.min}-${lr.max}\n`;
                    } else if (lr.min !== undefined) {
                        formattedResponse += `- **Min Level**: ${lr.min}\n`;
                    } else if (lr.max !== undefined) {
                        formattedResponse += `- **Max Level**: ${lr.max}\n`;
                    }
                }
                
                if (filteredSuggestions.parameters.itemBias) {
                    const bias = filteredSuggestions.parameters.itemBias;
                    if (bias.variety !== undefined || bias.cost !== undefined) {
                        formattedResponse += `- **Item Bias**:\n`;
                        if (bias.variety !== undefined) {
                            const varietyPercent = Math.round(bias.variety * 100);
                            formattedResponse += `  - Variety: ${varietyPercent}%\n`;
                        }
                        if (bias.cost !== undefined) {
                            const costPercent = Math.round(bias.cost * 100);
                            formattedResponse += `  - Cost: ${costPercent}%\n`;
                        }
                    }
                }
                
                if (filteredSuggestions.parameters.rarityDistribution) {
                    formattedResponse += `- **Rarity Distribution**:\n`;
                    // Display all four rarities in a compact format
                    formattedResponse += `  - Common: ${filteredSuggestions.parameters.rarityDistribution.Common}%, `;
                    formattedResponse += `Uncommon: ${filteredSuggestions.parameters.rarityDistribution.Uncommon}%, `;
                    formattedResponse += `Rare: ${filteredSuggestions.parameters.rarityDistribution.Rare}%, `;
                    formattedResponse += `Unique: ${filteredSuggestions.parameters.rarityDistribution.Unique}%\n`;
                }
            }
            
            // Add categories
            if (filteredSuggestions.categories) {
                formattedResponse += '\n**Categories**\n';
                
                if (filteredSuggestions.categories.included) {
                    formattedResponse += `- **Include**: ${filteredSuggestions.categories.included.join(', ')}\n`;
                }
                
                if (filteredSuggestions.categories.excluded) {
                    formattedResponse += `- **Exclude**: ${filteredSuggestions.categories.excluded.join(', ')}\n`;
                }
            }
            
            // Add reasoning at the bottom - preserve the full text
            // Check if the reasoning is from the original response or from the JSON
            let fullReasoning = reasoning;
            
            // If we have the original response, try to extract the full reasoning text
            // This handles cases where the JSON parsing might have truncated the reasoning
            if (response) {
                // Look for text outside the JSON that might contain the full reasoning
                const beforeJson = response.substring(0, response.indexOf('{'));
                const afterJson = response.substring(response.indexOf('}') + 1);
                
                // If there's substantial text before or after the JSON, it might contain the reasoning
                if (beforeJson.length > 50) {
                    fullReasoning = beforeJson.trim();
                } else if (afterJson.length > 50) {
                    fullReasoning = afterJson.trim();
                }
                
                // If the original response contains "reasoning" outside the JSON, try to extract it
                const reasoningMatch = response.match(/reasoning[:\s]+([\s\S]+?)(?=\n\n|\{|$)/i);
                if (reasoningMatch && reasoningMatch[1] && reasoningMatch[1].length > fullReasoning.length) {
                    fullReasoning = reasoningMatch[1].trim();
                }
            }
            
            formattedResponse += `\n**Reasoning**\n${fullReasoning}`;
            
            return formattedResponse;
        } catch (error) {
            console.error('Error processing AI response:', error);
            return response; // Return original response if there's an error
        }
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
- Level Range: ${shopSnapshot.levelRange.min}-${shopSnapshot.levelRange.max}`;

            // Add reference information
            const referenceInfo = `
Reference Information:
- Level Categories: ${LEVEL_MARKERS.map(m => `${m.label} (${m.threshold}+)`).join(', ')}
- Normal Gold Per Level: ${NORMAL_GOLD_PER_LEVEL[0]}-${NORMAL_GOLD_PER_LEVEL[NORMAL_GOLD_PER_LEVEL.length-1]} gold
- Standard Rarity Distribution: Common ${NORMAL_RARITY_DISTRIBUTION.Common}%, Uncommon ${NORMAL_RARITY_DISTRIBUTION.Uncommon}%, Rare ${NORMAL_RARITY_DISTRIBUTION.Rare}%, Unique ${NORMAL_RARITY_DISTRIBUTION.Unique}%`;

            // Use the baseContext and fillGapsTemplate from AI_PROMPTS
            const analysisPrompt = `${AI_PROMPTS.baseContext}

${referenceInfo}

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
            
            // Process the AI response to format it better
            const processedResponse = processAIResponse(data.answer);
            
            // Create AI response message
            const assistantMessage = {
                role: 'assistant',
                content: processedResponse,
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
- Level Range: ${shopSnapshot.levelRange.min}-${shopSnapshot.levelRange.max}`;

            // Add reference information
            const referenceInfo = `
Reference Information:
- Level Categories: ${LEVEL_MARKERS.map(m => `${m.label} (${m.threshold}+)`).join(', ')}
- Normal Gold Per Level: ${NORMAL_GOLD_PER_LEVEL[0]}-${NORMAL_GOLD_PER_LEVEL[NORMAL_GOLD_PER_LEVEL.length-1]} gold
- Standard Rarity Distribution: Common ${NORMAL_RARITY_DISTRIBUTION.Common}%, Uncommon ${NORMAL_RARITY_DISTRIBUTION.Uncommon}%, Rare ${NORMAL_RARITY_DISTRIBUTION.Rare}%, Unique ${NORMAL_RARITY_DISTRIBUTION.Unique}%`;

            // Use the baseContext from AI_PROMPTS
            const contextualQuestion = `${AI_PROMPTS.baseContext}

${referenceInfo}

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
            
            // Process the AI response if it contains JSON
            let processedResponse = data.answer;
            if (data.answer.includes('{') && data.answer.includes('}')) {
                processedResponse = processAIResponse(data.answer);
            }
            
            // Create AI response message
            const assistantMessage = {
                role: 'assistant',
                content: processedResponse,
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
