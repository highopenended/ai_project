/**
 * AI Prompt Generator
 * 
 * This module serves as the central hub for generating AI prompts used in the shop generator.
 * It combines shop data, preserved fields, and conversation history to create comprehensive
 * prompts for the AI assistant.
 */

import { 
  AI_RULES
} from './aiConstants';
import { formatShopFields } from './aiFieldFormatter';
import { analyzeShopData } from './aiShopAnalyzer';
import { formatPreservedFields } from './aiPreservedFieldsManager';

/**
 * Generates a complete AI prompt for shop analysis with preserved fields
 * 
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @param {Object} preservedFields - Fields marked as preserved by the user
 * @param {string} conversationHistory - Previous conversation history
 * @returns {string} Complete AI prompt
 */
export const generateAnalysisPrompt = (shopSnapshot, preservedFields, conversationHistory) => {
  // Format all shop fields
  const formattedShopData = formatShopFields(shopSnapshot);
  
  // Analyze shop data against reference values
  const shopAnalysis = analyzeShopData(shopSnapshot);
  
  // Format preserved fields
  const preservedFieldsText = formatPreservedFields(preservedFields, shopSnapshot);
  
  // Add filter constraints instructions
  const filterConstraintsText = generateFilterConstraintsText(shopSnapshot);
  
  // Construct the complete prompt
  return `${AI_RULES}

Current shop values:
${formattedShopData}

Shop Analysis:
${shopAnalysis}

Previous conversation history:
${conversationHistory}

${preservedFieldsText}

${filterConstraintsText}

Please format your response with clear headings using **bold text** for section titles and numbered lists for suggestions.`;
};

/**
 * Generates a prompt for regular chat interactions
 * 
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @param {string} conversationHistory - Previous conversation history
 * @param {string} userQuestion - User's current question
 * @returns {string} Complete chat prompt
 */
export const generateChatPrompt = (shopSnapshot, conversationHistory, userQuestion) => {
  // Format all shop fields
  const formattedShopData = formatShopFields(shopSnapshot);
  
  // Analyze shop data against reference values
  const shopAnalysis = analyzeShopData(shopSnapshot);
  
  // Add filter constraints instructions
  const filterConstraintsText = generateFilterConstraintsText(shopSnapshot);
  
  return `${AI_RULES}

Current shop values:
${formattedShopData}

Shop Analysis:
${shopAnalysis}

${filterConstraintsText}

Previous conversation history:
${conversationHistory}

Current question: ${userQuestion}

Format your response with clear headings using **bold text** for section titles and bullet points for lists.`;
};

/**
 * Generates text explaining filter constraints
 * 
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {string} Filter constraints text
 */
const generateFilterConstraintsText = (shopSnapshot) => {
  if (!shopSnapshot.availableFilters) return "";
  
  return `IMPORTANT FILTER CONSTRAINTS:
When suggesting changes to category filters, you MUST ONLY suggest options from the available categories list provided above. Do not suggest any categories that are not in this list.

If the user asks about adding specific categories, verify they exist in the available options before suggesting them. If they don't exist in the available options, politely inform the user that those options are not available and suggest alternatives from the valid list.`;
}; 