/**
 * Utilities for serializing and deserializing shop data for storage
 * This ensures that data saved to Firebase contains only serializable values
 * and that data loaded from Firebase is properly formatted for use in the application.
 */

/**
 * Serializes AI conversation messages to ensure they can be stored in Firebase
 * Removes any function references and ensures only serializable data is included
 * 
 * @param {Array} messages - Array of conversation messages
 * @returns {Array} - Serialized messages safe for storage
 */
export const serializeAiConversations = (messages) => {
  if (!messages || !Array.isArray(messages)) {
    console.log("serializeAiConversations: No messages to serialize");
    return [];
  }

  console.log("serializeAiConversations: Serializing", messages.length, "messages");
  
  const serializedMessages = messages.map(message => {
    // Create a base serialized message with common properties
    const serializedMessage = {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp
    };

    // If this is a suggestion message, include the suggestion flag and clean the suggested changes
    if (message.isSuggestion) {
      console.log("serializeAiConversations: Serializing suggestion message");
      serializedMessage.isSuggestion = true;
      
      // Only include serializable data from suggestedChanges
      if (message.suggestedChanges) {
        serializedMessage.suggestedChanges = {
          // Shop details
          name: message.suggestedChanges.name,
          keeperName: message.suggestedChanges.keeperName,
          type: message.suggestedChanges.type,
          location: message.suggestedChanges.location,
          description: message.suggestedChanges.description,
          keeperDescription: message.suggestedChanges.keeperDescription,
          
          // Shop parameters
          gold: message.suggestedChanges.gold,
          levelRange: message.suggestedChanges.levelRange,
          itemBias: message.suggestedChanges.itemBias,
          rarityDistribution: message.suggestedChanges.rarityDistribution,
          
          // Summary for display
          suggestionsSummary: message.suggestedChanges.suggestionsSummary
        };
      }
    }

    return serializedMessage;
  });
  
  console.log("serializeAiConversations: Serialization complete");
  return serializedMessages;
};

/**
 * Deserializes AI conversation messages from storage format to application format
 * The actual ConfirmSuggestionsButton components will be created during render
 * based on the isSuggestion flag and suggestedChanges data
 * 
 * @param {Array} serializedMessages - Array of serialized conversation messages
 * @returns {Array} - Deserialized messages ready for use in the application
 */
export const deserializeAiConversations = (serializedMessages) => {
  if (!serializedMessages || !Array.isArray(serializedMessages)) {
    console.log("deserializeAiConversations: No messages to deserialize");
    return [];
  }

  console.log("deserializeAiConversations: Deserializing", serializedMessages.length, "messages");
  
  const deserializedMessages = serializedMessages.map(message => {
    // Create a base deserialized message with common properties
    const deserializedMessage = {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp
    };

    // If this is a suggestion message, include the suggestion flag and suggested changes
    if (message.isSuggestion) {
      console.log("deserializeAiConversations: Deserializing suggestion message");
      deserializedMessage.isSuggestion = true;
      deserializedMessage.suggestedChanges = message.suggestedChanges;
    }

    return deserializedMessage;
  });
  
  console.log("deserializeAiConversations: Deserialization complete");
  return deserializedMessages;
};

/**
 * Serializes the entire shop state for storage
 * Ensures all data is serializable and removes any function references
 * 
 * @param {Object} shopState - The shop state to serialize
 * @param {Object} filterMaps - The filter maps to serialize
 * @param {Array} inventory - The inventory items to serialize
 * @returns {Object} - Serialized shop data safe for storage
 */
export const serializeShopData = (shopState, filterMaps, inventory) => {
  // Create a clean copy of shop data without functions and non-serializable fields
  const serializedShopData = {
    // Shop details
    id: shopState.id,
    name: shopState.name,
    keeperName: shopState.keeperName,
    type: shopState.type,
    location: shopState.location,
    description: shopState.description,
    keeperDescription: shopState.keeperDescription,
    dateCreated: shopState.dateCreated,
    dateLastEdited: new Date(),
    
    // Shop parameters
    gold: shopState.gold,
    levelRange: shopState.levelRange,
    itemBias: shopState.itemBias,
    rarityDistribution: shopState.rarityDistribution,
    
    // Inventory
    currentStock: inventory,
    
    // Filters - convert Maps to plain objects
    filterStorageObjects: {
      categories: Object.fromEntries(filterMaps.categories.entries()),
      subcategories: Object.fromEntries(filterMaps.subcategories.entries()),
      traits: Object.fromEntries(filterMaps.traits.entries()),
    },
    
    // AI conversations - serialize to remove any function references
    aiConversations: serializeAiConversations(shopState.aiConversations || [])
  };

  return serializedShopData;
}; 