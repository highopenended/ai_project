// Template for default shop data structure
// This serves as the initial state template for new shops
const shopData = {
  // Basic shop information
  id: '',
  name: 'Unnamed Shop',
  keeperName: 'Unknown',
  type: 'General Store',
  location: 'Unknown Location',
  description: 'No details available',
  keeperDescription: 'No details available',
  dateCreated: new Date(),
  dateLastEdited: new Date(),

  // Shop generation settings
  gold: 1000,
  levelRange: {
    min: 0,
    max: 10
  },
  itemBias: { x: 0.5, y: 0.5 },
  rarityDistribution: {
    Common: 95.0,
    Uncommon: 4.5,
    Rare: 0.49,
    Unique: 0.01
  },

  // Filter states
  // Each filter cycles through three states when toggled:
  // - Not in object (or IGNORE): Default state, item neither included nor excluded
  // - INCLUDE: Item is specifically included in generation
  // - EXCLUDE: Item is specifically excluded from generation
  // The cycle goes: IGNORE -> INCLUDE -> EXCLUDE -> IGNORE
  filterStorageObjects: {
    categories: {},
    subcategories: {},
    traits: {}
  },

  // Current inventory
  // Note: For performance reasons, this is maintained in a separate state during normal operation
  // and only synced during save/load/reset operations
  currentStock: []
};

export default shopData; 