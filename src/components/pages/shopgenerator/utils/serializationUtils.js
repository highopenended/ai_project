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
    return [];
  }

  
  const serializedMessages = messages.map(message => {
    // Create a base serialized message with common properties
    const serializedMessage = {
      role: message.role,
      content: message.content,
      formattedContent: message.formattedContent || null,
      timestamp: message.timestamp
    };

    // If this is a suggestion message, include the suggestion flag and clean the suggested changes
    if (message.isSuggestion) {
      serializedMessage.isSuggestion = true;
      
      // Only include serializable data from suggestedChanges
      if (message.suggestedChanges) {
        // Deep clone to avoid reference issues
        const cleanedChanges = {};
        
        // Copy simple fields directly
        if (message.suggestedChanges.name !== undefined) 
          cleanedChanges.name = message.suggestedChanges.name;
        
        if (message.suggestedChanges.keeperName !== undefined) 
          cleanedChanges.keeperName = message.suggestedChanges.keeperName;
        
        if (message.suggestedChanges.type !== undefined) 
          cleanedChanges.type = message.suggestedChanges.type;
        
        if (message.suggestedChanges.location !== undefined) 
          cleanedChanges.location = message.suggestedChanges.location;
        
        if (message.suggestedChanges.description !== undefined) 
          cleanedChanges.description = message.suggestedChanges.description;
        
        if (message.suggestedChanges.keeperDescription !== undefined) 
          cleanedChanges.keeperDescription = message.suggestedChanges.keeperDescription;
        
        if (message.suggestedChanges.gold !== undefined) 
          cleanedChanges.gold = Number(message.suggestedChanges.gold);
        
        // Properly format level range as a clean object with numeric values
        if (message.suggestedChanges.levelRange) {
          cleanedChanges.levelRange = {
            min: Number(message.suggestedChanges.levelRange.min),
            max: Number(message.suggestedChanges.levelRange.max)
          };
        }
        
        // Properly format itemBias to ensure consistent x/y structure
        if (message.suggestedChanges.itemBias) {
          const itemBias = message.suggestedChanges.itemBias;
          // Initialize with default values
          let x = 0.5;
          let y = 0.5;
          
          if (typeof itemBias === 'object') {
            // Handle direct x/y format
            if ('x' in itemBias && 'y' in itemBias) {
              x = Number(itemBias.x);
              y = Number(itemBias.y);
            } 
            // Handle Variety/Cost format
            else if ('Variety' in itemBias || 'variety' in itemBias ||
                    'Cost' in itemBias || 'cost' in itemBias) {
              
              x = Number(itemBias.Variety || itemBias.variety || 0.5);
              y = Number(itemBias.Cost || itemBias.cost || 0.5);
            }
          }
          
          // Always store as x/y format with numeric values
          cleanedChanges.itemBias = { x, y };
        }
        
        // Clean rarity distribution to ensure numeric values
        if (message.suggestedChanges.rarityDistribution) {
          cleanedChanges.rarityDistribution = {};
          Object.entries(message.suggestedChanges.rarityDistribution).forEach(([key, value]) => {
            cleanedChanges.rarityDistribution[key] = Number(value);
          });
        }
        
        // Add summary
        if (message.suggestedChanges.suggestionsSummary) {
          cleanedChanges.suggestionsSummary = message.suggestedChanges.suggestionsSummary;
        }
        
        serializedMessage.suggestedChanges = cleanedChanges;
      }
    }

    return serializedMessage;
  });
  
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
  if (!serializedMessages || !Array.isArray(serializedMessages))  return [];
  
  const deserializedMessages = serializedMessages.map(message => {
    // Create a base deserialized message with common properties
    const deserializedMessage = {
      role: message.role,
      content: message.content,
      formattedContent: message.formattedContent || null,
      timestamp: message.timestamp
    };

    // If this is a suggestion message, include the suggestion flag and suggested changes
    if (message.isSuggestion) {
      deserializedMessage.isSuggestion = message.isSuggestion;
      deserializedMessage.suggestedChanges = message.suggestedChanges;
    }

    return deserializedMessage;
  });
  
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