import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../../../../context/AuthContext";
import { useItemData } from "../../../../../context/itemData";
import "./Tab_AiAssistant.css";
import ImprovementDialog from "./improvementdialog/ImprovementDialog";
import { generateAnalysisPrompt, generateChatPrompt } from "../../utils/aipromptgenerator/aiPromptGenerator";
import { formatContent } from "../../utils/aipromptgenerator/contentFormatter";
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

            // Get conversation history
            const conversationHistory = messages
                .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
                .join("\n");

            // Generate the analysis prompt using the utility function
            const analysisPrompt = generateAnalysisPrompt(
                shopSnapshot,
                fields,
                conversationHistory
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

            const data = await response.json();

            // Validate response data
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            if (!data || !data.answer) {
                throw new Error('Invalid response from API: Missing answer');
            }

            // Create AI response message
            const assistantMessage = {
                role: "assistant",
                content: data.answer,
                timestamp: Date.now(),
            };
            console.log("AI RESPONSE:");
            console.log("--------------------------------");
            console.log(data.answer);
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

            const data = await response.json();

            // Validate response data
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            if (!data || !data.answer) {
                throw new Error('Invalid response from API: Missing answer');
            }

            // Create AI response message
            const assistantMessage = {
                role: "assistant",
                content: data.answer,
                timestamp: Date.now(),
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
                                    dangerouslySetInnerHTML={{ __html: formatContent(message.content, message.role) }}
                                />
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
            })
        ),
        onAiConversationUpdate: PropTypes.func,
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
