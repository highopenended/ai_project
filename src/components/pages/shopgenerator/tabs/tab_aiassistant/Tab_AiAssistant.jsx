import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../../../../context/AuthContext";
import { useItemData } from "../../../../../context/itemData";
import "./Tab_AiAssistant.css";
import ImprovementDialog from "./improvementdialog/ImprovementDialog";
import ConfirmSuggestionsButton from "./confirmsuggestionsbutton/ConfirmSuggestionsButton";
import { generateAnalysisPrompt, generateChatPrompt } from "../../utils/aipromptgenerator/aiPromptGenerator";
import { formatContent, formatSuggestedChanges } from "../../utils/aipromptgenerator/contentFormatter";
import { extractAvailableFilterOptions } from "../../utils/filterGroupUtils";
import traitList from "../../../../../data/trait-list.json";

const defaultFilterMaps = {
    categories: new Map(),
    subcategories: new Map(),
    traits: new Map(),
};

// Helper function to create shop snapshot
export const createShopSnapshot = (shopState, filterMaps, categoryData, preservedFields = null) => {
    // Extract filter information from filterMaps
    const getFilteredItems = (filterMap, state) => {
        return Array.from(filterMap.entries())
            .filter(([, filterState]) => filterState === state)
            .map(([item]) => item);
    };

    // Get included and excluded items for categories only
    const filterSelections = {
        categories: {
            included: getFilteredItems(filterMaps.categories, 1),
            excluded: getFilteredItems(filterMaps.categories, -1),
        }
    };

    // Extract available filter options (categories only) if category filter is not preserved
    const availableFilters = preservedFields && !preservedFields.filterCategories ? {
        categories: extractAvailableFilterOptions(categoryData, traitList).categories
    } : {};

    return {
        // Shop details
        name: shopState?.name || "",
        keeperName: shopState?.keeperName || "",
        type: shopState?.type || "",
        location: shopState?.location || "",
        description: shopState?.description || "",
        keeperDescription: shopState?.keeperDescription || "",

        // Shop parameters
        gold: shopState?.gold || 0,
        levelRange: shopState?.levelRange || { min: 0, max: 0 },
        itemBias: shopState?.itemBias || {},
        rarityDistribution: shopState?.rarityDistribution || {},

        // Filter selections
        filterSelections,

        // Available filter options
        availableFilters,

        // Shop ID for reference
        id: shopState?.id || "",
    };
};

function Tab_AiAssistant({ shopState = {}, filterMaps = defaultFilterMaps }) {
    const { currentUser } = useAuth();
    const { categoryData } = useItemData();
    const [messages, setMessages] = useState(shopState.aiConversations || []);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Update messages when shopState.aiConversations changes
    useEffect(() => {
        setMessages(shopState.aiConversations || []);
    }, [shopState.aiConversations]);

    // Function to update parent component with new messages
    const updateParentState = useCallback(
        (newMessages) => {
            if (shopState && typeof shopState.onAiConversationUpdate === "function") {
                shopState.onAiConversationUpdate(newMessages);
            }
        },
        [shopState]
    );

    // Function to clear chat history
    const handleClearChat = useCallback(() => {
        if (isLoading || isAnalyzing) return;

        const emptyMessages = [];
        setMessages(emptyMessages);
        updateParentState(emptyMessages);
    }, [isLoading, isAnalyzing, updateParentState]);

    // Function to apply suggested changes to the shop
    const handleApplySuggestions = useCallback((suggestedChanges) => {
        // Create a copy of the current shop state
        const updatedShopState = { ...shopState };
        
        // Apply shop details changes if present
        if (suggestedChanges.name !== undefined) {
            updatedShopState.name = String(suggestedChanges.name);
        }
        
        if (suggestedChanges.keeperName !== undefined) {
            updatedShopState.keeperName = String(suggestedChanges.keeperName);
        }
        
        if (suggestedChanges.type !== undefined) {
            updatedShopState.type = String(suggestedChanges.type);
        }
        
        if (suggestedChanges.location !== undefined) {
            updatedShopState.location = String(suggestedChanges.location);
        }
        
        if (suggestedChanges.description !== undefined) {
            updatedShopState.description = String(suggestedChanges.description);
        }
        
        if (suggestedChanges.keeperDescription !== undefined) {
            updatedShopState.keeperDescription = String(suggestedChanges.keeperDescription);
        }

        // Apply gold changes if present
        if (suggestedChanges.gold !== undefined) {
            updatedShopState.gold = Number(suggestedChanges.gold);
        }

        // Apply level range changes if present
        if (suggestedChanges.levelRange) {
            updatedShopState.levelRange = {
                min: Number(suggestedChanges.levelRange.min),
                max: Number(suggestedChanges.levelRange.max)
            };
        }

        // Apply item bias changes if present
        if (suggestedChanges.itemBias) {
            // Initialize with default values
            let x = 0.5;
            let y = 0.5;
            
            // Make sure we're preserving the correct structure with x and y properties
            if (typeof suggestedChanges.itemBias === 'object') {
                // Handle direct x/y format
                if ('x' in suggestedChanges.itemBias && 'y' in suggestedChanges.itemBias) {
                    x = parseFloat(suggestedChanges.itemBias.x);
                    y = parseFloat(suggestedChanges.itemBias.y);
                } 
                // Handle Variety/Cost format
                else if ('Variety' in suggestedChanges.itemBias || 'variety' in suggestedChanges.itemBias ||
                        'Cost' in suggestedChanges.itemBias || 'cost' in suggestedChanges.itemBias) {
                    
                    x = parseFloat(suggestedChanges.itemBias.Variety || 
                                  suggestedChanges.itemBias.variety || 0.5);
                    y = parseFloat(suggestedChanges.itemBias.Cost || 
                                  suggestedChanges.itemBias.cost || 0.5);
                }
            } else if (typeof suggestedChanges.itemBias === 'string') {
                // Handle string format like "Variety: 0.7, Cost: 0.3"
                const varietyMatch = suggestedChanges.itemBias.match(/Variety:\s*([\d.]+)/i);
                const costMatch = suggestedChanges.itemBias.match(/Cost:\s*([\d.]+)/i);
                
                if (varietyMatch || costMatch) {
                    x = varietyMatch ? parseFloat(varietyMatch[1]) : 0.5;
                    y = costMatch ? parseFloat(costMatch[1]) : 0.5;
                }
            }
            
            // Always set as a clean x/y object with numeric values
            updatedShopState.itemBias = { x, y };
        }

        // Apply rarity distribution changes if present
        if (suggestedChanges.rarityDistribution) {
            // Create a clean copy with numeric values
            const cleanedRarityDistribution = {};
            Object.entries(suggestedChanges.rarityDistribution).forEach(([key, value]) => {
                cleanedRarityDistribution[key] = Number(value);
            });
            updatedShopState.rarityDistribution = cleanedRarityDistribution;
        }

        // Try to update the shop state through the provided function
        if (shopState && typeof shopState.onShopUpdate === "function") {
            shopState.onShopUpdate(updatedShopState);
        } else {
            // Fallback: Dispatch a custom event with the updated state
            const event = new CustomEvent('shop:update-requested', { 
                detail: { updatedShopState } 
            });
            window.dispatchEvent(event);
            
            // Show a notification to the user
            alert("Changes have been prepared but couldn't be applied automatically. Please manually update your shop parameters.");
        }
    }, [shopState]);

    // Function to analyze shop with preserved fields
    const analyzeShopWithPreservedFields = useCallback(async (fields) => {
        if (!currentUser || isLoading || isAnalyzing) return;

        setIsAnalyzing(true);
        try {
            console.log("Fields passed to analyzeShopWithPreservedFields:", fields);
            
            // Create user message for analysis request
            const userMessage = {
                role: "user",
                content: "Please analyze my shop and suggest improvements for the fields I haven't marked as preserved.",
                timestamp: Date.now(),
            };

            // Update messages immediately with user input
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            updateParentState(updatedMessages);

            // Get shop snapshot
            const shopSnapshot = createShopSnapshot(shopState, filterMaps, categoryData, fields);


            // Generate the analysis prompt using the utility function
            const analysisPrompt = generateAnalysisPrompt(
                shopSnapshot,
                fields
            );

            // Log the final prompt being sent to the AI
            console.log("FINAL AI PROMPT:");
            console.log("--------------------------------");
            console.log(analysisPrompt);
            console.log("________________________________");

            // Get AI response from Firebase function
            const response = await fetch("https://us-central1-project-dm-helper.cloudfunctions.net/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: analysisPrompt,
                }),
            });

            // Enhanced error handling
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    headers: Object.fromEntries(response.headers.entries())
                });
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Validate response data
            if (!data || !data.answer) {
                throw new Error('Invalid response from API: Missing answer');
            }

            // Parse the JSON response if it exists
            let suggestedChanges = null;
            try {
                // Look for JSON object in the response
                const jsonMatch = data.answer.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonStr = jsonMatch[0];
                    suggestedChanges = JSON.parse(jsonStr);

                    // Handle item bias format conversion if needed
                    if (suggestedChanges.itemBias) {
                        // If itemBias is provided as Variety/Cost format in the response
                        if (typeof suggestedChanges.itemBias === 'object') {
                            // If it has Variety/Cost properties instead of x/y
                            if ('Variety' in suggestedChanges.itemBias || 'variety' in suggestedChanges.itemBias || 
                                'Cost' in suggestedChanges.itemBias || 'cost' in suggestedChanges.itemBias) {
                                
                                const variety = suggestedChanges.itemBias.Variety || 
                                               suggestedChanges.itemBias.variety || 0.5;
                                const cost = suggestedChanges.itemBias.Cost || 
                                            suggestedChanges.itemBias.cost || 0.5;
                                
                                // Convert to x/y format
                                suggestedChanges.itemBias = {
                                    x: parseFloat(variety),
                                    y: parseFloat(cost)
                                };
                            }
                        } else if (typeof suggestedChanges.itemBias === 'string') {
                            // Handle string format like "Variety: 0.7, Cost: 0.3"
                            const varietyMatch = suggestedChanges.itemBias.match(/Variety:\s*([\d.]+)/i);
                            const costMatch = suggestedChanges.itemBias.match(/Cost:\s*([\d.]+)/i);
                            
                            if (varietyMatch || costMatch) {
                                const variety = varietyMatch ? parseFloat(varietyMatch[1]) : 0.5;
                                const cost = costMatch ? parseFloat(costMatch[1]) : 0.5;
                                
                                suggestedChanges.itemBias = {
                                    x: variety,
                                    y: cost
                                };
                            }
                        }
                    }
                }
            } catch (parseErr) {
                console.error("Error parsing suggested changes:", parseErr);
            }

            console.log("Suggested changes:", suggestedChanges);

            // Create AI response message with suggestion flag and data
            const assistantMessage = {
                role: "assistant",
                content: data.answer,
                formattedContent: suggestedChanges ? formatSuggestedChanges(suggestedChanges) : null,
                timestamp: Date.now(),
                isSuggestion: true,
                suggestedChanges: suggestedChanges
            };
            console.log("AI RESPONSE:");
            console.log("--------------------------------");
            console.log(assistantMessage);
            console.log("________________________________");

            // Update messages with AI response
            const finalMessages = [...updatedMessages, assistantMessage];
            setMessages(finalMessages);
            updateParentState(finalMessages);
        } catch (err) {
            console.error("Error analyzing shop:", err);
            setError(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [currentUser, isLoading, isAnalyzing, messages, shopState, filterMaps, categoryData, updateParentState]);

    // Function to handle opening the improvement dialog
    const handleOpenDialog = useCallback(() => {
        setIsDialogOpen(true);
    }, []);

    // Function to handle dialog confirmation
    const handleDialogConfirm = useCallback((selectedFields) => {
        setIsDialogOpen(false); // Close the dialog first
        analyzeShopWithPreservedFields(selectedFields);
    }, [analyzeShopWithPreservedFields]);

    // Replace the old analyzeShopState function with a function that opens the dialog
    const analyzeShopState = useCallback(() => {
        handleOpenDialog();
    }, [handleOpenDialog]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim() || !currentUser || isLoading) return;

        setIsLoading(true);
        try {
            // Create user message
            const userMessage = {
                role: "user",
                content: input.trim(),
                timestamp: Date.now(),
            };

            // Update messages immediately with user input
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            updateParentState(updatedMessages);
            setInput("");

            // Get shop snapshot
            const shopSnapshot = createShopSnapshot(shopState, filterMaps, categoryData);

            // Get conversation history
            const conversationHistory = messages
                .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
                .join("\n");

            // Generate the chat prompt using the utility function
            const aiChatPrompt = generateChatPrompt(
                shopSnapshot,
                conversationHistory,
                input
            );

            // Log the final prompt being sent to the AI
            console.log("FINAL CHAT PROMPT:");
            console.log("--------------------------------");
            console.log(aiChatPrompt);
            console.log("________________________________");

            // Get AI response from Firebase function
            const response = await fetch("https://us-central1-project-dm-helper.cloudfunctions.net/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: aiChatPrompt,
                }),
            });

            // Enhanced error handling
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    headers: Object.fromEntries(response.headers.entries())
                });
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Validate response data
            if (!data || !data.answer) {
                throw new Error('Invalid response from API: Missing answer');
            }

            // Create AI response message
            const assistantMessage = {
                role: "assistant",
                content: data.answer,
                formattedContent: formatContent(data.answer, "assistant"),
                timestamp: Date.now()
            };

            // Update messages with AI response
            const finalMessages = [...updatedMessages, assistantMessage];
            setMessages(finalMessages);
            updateParentState(finalMessages);
        } catch (err) {
            console.error("Error in chat:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, isLoading, input, messages, shopState, filterMaps, categoryData, updateParentState]);

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
                <div className="ai-assistant-actions">
                    <button 
                        className="analyze-button" 
                        onClick={analyzeShopState} 
                        disabled={isAnalyzing || isLoading}
                        data-tooltip="Click to select fields for the Oracle to consider"
                    >
                        {isAnalyzing ? "Analyzing..." : "Suggest Improvements"}
                    </button>
                    <button
                        className="clear-button"
                        onClick={handleClearChat}
                        disabled={isAnalyzing || isLoading || messages.length === 0}
                    >
                        Clear Chat
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="ai-assistant-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the Oracle about your shop..."
                        disabled={isLoading || isAnalyzing}
                    />
                    <button type="submit" disabled={isLoading || isAnalyzing || !input.trim()}>
                        Send
                    </button>
                </form>
                <div className="ai-assistant-messages">
                    {(isLoading || isAnalyzing) && (
                        <div className="ai-assistant-loading">
                            {isAnalyzing ? "Analyzing your shop..." : "Consulting the Oracle..."}
                        </div>
                    )}
                    {messages.length === 0 ? (
                        <div className="ai-assistant-empty">
                            <p>
                                No conversation yet. Ask a question or use &quot;Suggest Improvements&quot; to get
                                started.
                            </p>
                        </div>
                    ) : (
                        sortedMessages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}
                            >
                                <div
                                    className="message-content"
                                    dangerouslySetInnerHTML={{ 
                                        __html: message.formattedContent || formatContent(message.content, message.role) 
                                    }}
                                />
                                {message.isSuggestion && message.suggestedChanges && (
                                    <ConfirmSuggestionsButton 
                                        suggestedChanges={message.suggestedChanges}
                                        onApply={handleApplySuggestions}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                {/* Improvement Dialog */}
                <ImprovementDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    shopState={shopState}
                    filterMaps={filterMaps}
                    onConfirm={handleDialogConfirm}
                />
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
        aiConversations: PropTypes.arrayOf(
            PropTypes.shape({
                role: PropTypes.oneOf(["user", "assistant"]).isRequired,
                content: PropTypes.string.isRequired,
                timestamp: PropTypes.number.isRequired,
                isSuggestion: PropTypes.bool,
                suggestedChanges: PropTypes.object,
            })
        ),
        onAiConversationUpdate: PropTypes.func,
        onShopUpdate: PropTypes.func,
    }),
    filterMaps: PropTypes.shape({
        categories: PropTypes.instanceOf(Map),
        subcategories: PropTypes.instanceOf(Map),
        traits: PropTypes.instanceOf(Map),
    }),
};

Tab_AiAssistant.displayName = "The Oracle";
Tab_AiAssistant.minWidth = 250;

export default Tab_AiAssistant;
