// Define the shopData object
const shopData = {
  shortData: {
    shopName: 'Unnamed Shop',
    shopKeeperName: 'Unknown',
    type: 'General Store',
    location: 'Unknown Location'
  },
  longData: {
    shopDetails: 'No details available',
    shopKeeperDetails: 'No details available'
  },
  parameters: {
    goldAmount: 1000,
    levelLow: 0,
    levelHigh: 10,
    shopBias: { x: 0.5, y: 0.5 },
    rarityDistribution: {
      Common: 95.0,
      Uncommon: 4.5,
      Rare: 0.49,
      Unique: 0.01
    },
    categories: {
      included: [],
      excluded: []
    },
    subcategories: {
      included: [],
      excluded: []
    },
    traits: {
      included: [],
      excluded: []
    },
    currentStock: []
  },
  id: '',
  dateCreated: new Date(),
  dateLastEdited: new Date()
};

// Export the shopData object
export default shopData; 