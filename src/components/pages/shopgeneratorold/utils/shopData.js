// Define the shopData object
const shopData = {
  shortData: {
    shopName: '',
    shopKeeperName: '',
    type: '',
    location: ''
  },
  longData: {
    shopDetails: '',
    shopKeeperDetails: ''
  },
  parameters: {
    goldAmount: 0,
    levelLow: 0,
    levelHigh: 0,
    shopBias: { x: 0, y: 0 },
    rarityDistribution: {
      common: 0,
      uncommon: 0,
      rare: 0,
      unique: 0
    },
    categories: {},
    subcategories: {},
    traits: {},
    currentStock: []
  },
  id: '',
  dateCreated: new Date(),
  dateLastEdited: new Date()
};

// Export the shopData object
export default shopData; 