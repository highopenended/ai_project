// Global debug configuration
const DEBUG_CONFIG = {
  enabled: true, // Master debug switch
  areas: {
    // Core application areas
    tabManagement: false,
    tabSplit: false,
    initialization: false,
    stateSync: false,
    tabCreation: false,
    performance: false,
    
    // Component areas
    layout: false,
    auth: false,
    routing: false,
    shopGenerator: false,
    
    // Add other areas as needed
  },
};

/**
 * Debug logger utility
 * @param {string} area - The area/module being debugged
 * @param {string} message - The debug message
 * @param {any} data - Optional data to log
 */
export const debug = (area, message, data = "") => {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.areas[area]) return;
  const timestamp = performance.now().toFixed(2);
  
  // Allow for custom prefixes based on area
  const prefix = {
    initialization: "🚀 [Init]",
    tabManagement: "📑 [Tabs]",
    stateSync: "🔄 [Sync]",
    tabCreation: "🏗️ [Create]",
    performance: "⏱️ [Perf]",
    layout: "📐 [Layout]",
    auth: "🔐 [Auth]",
    routing: "🧭 [Route]",
    shopGenerator: "🏪 [Shop]",
  }[area] || `[${area}]`;
  
  console.log(`${prefix} [${timestamp}ms] ${message}`, data ? data : "");
};

/**
 * Performance tracking utility
 * @param {string} area - The area being measured
 * @param {string} name - The name of the operation
 * @param {string} startMark - Optional start mark for the measurement
 * @returns {string} The end mark name
 */
export const trackPerformance = (area, name, startMark = null) => {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.areas[area]) return;
  
  const endMark = `${area}-${name}-end-${Date.now()}`;
  performance.mark(endMark);

  if (startMark) {
    try {
      performance.measure(`${area} - ${name}`, startMark, endMark);
      const measurements = performance.getEntriesByName(`${area} - ${name}`);
      const lastMeasurement = measurements[measurements.length - 1];
      debug('performance', `${area} - ${name} operation took ${lastMeasurement.duration.toFixed(2)}ms`);
    } catch (e) {
      debug('performance', `Error measuring ${area} - ${name}`, e);
    }
  }
  return endMark;
};

/**
 * Creates a performance mark
 * @param {string} area - The area being measured
 * @param {string} name - The name of the operation
 * @returns {string} The mark name
 */
export const createMark = (area, name) => {
  const markName = `${area}-${name}-start-${Date.now()}`;
  performance.mark(markName);
  return markName;
};

/**
 * Get a copy of the current debug configuration
 * @returns {Object} The current debug configuration
 */
export const getDebugConfig = () => ({ ...DEBUG_CONFIG }); 