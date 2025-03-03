import { useState } from 'react';
import PropTypes from 'prop-types';
import './Tab_AiAssistant.css';

const defaultFilterMaps = {
    categories: new Map(),
    subcategories: new Map(),
    traits: new Map()
};

function Tab_AiAssistant({
    shopState = {},
    filterMaps = defaultFilterMaps,
    inventory = []
}) {
    const [error, setError] = useState(null);

    const handleTestClick = () => {
        try {
            // Create a complete state snapshot
            const stateSnapshot = {
                // Shop details
                id: shopState?.id || '',
                name: shopState?.name || '',
                keeperName: shopState?.keeperName || '',
                type: shopState?.type || '',
                location: shopState?.location || '',
                description: shopState?.description || '',
                keeperDescription: shopState?.keeperDescription || '',
                dateCreated: shopState?.dateCreated || new Date(),
                dateLastEdited: shopState?.dateLastEdited || new Date(),
                
                // Shop parameters
                gold: shopState?.gold || 0,
                levelRange: shopState?.levelRange || { min: 0, max: 0 },
                itemBias: shopState?.itemBias || {},
                rarityDistribution: shopState?.rarityDistribution || {},
                
                // Filter states
                filterStorageObjects: {
                    categories: Object.fromEntries((filterMaps?.categories || new Map()).entries()),
                    subcategories: Object.fromEntries((filterMaps?.subcategories || new Map()).entries()),
                    traits: Object.fromEntries((filterMaps?.traits || new Map()).entries()),
                },
                
                // Current inventory
                currentStock: inventory || []
            };

            // Log the complete state snapshot
            console.log('=== Shop Generator State Snapshot ===');
            console.log('Shop Details:', {
                id: stateSnapshot.id,
                name: stateSnapshot.name,
                keeperName: stateSnapshot.keeperName,
                type: stateSnapshot.type,
                location: stateSnapshot.location,
                description: stateSnapshot.description,
                keeperDescription: stateSnapshot.keeperDescription,
                dateCreated: stateSnapshot.dateCreated,
                dateLastEdited: stateSnapshot.dateLastEdited,
            });
            console.log('Shop Parameters:', {
                gold: stateSnapshot.gold,
                levelRange: stateSnapshot.levelRange,
                itemBias: stateSnapshot.itemBias,
                rarityDistribution: stateSnapshot.rarityDistribution,
            });
            console.log('Filter States:', {
                categories: stateSnapshot.filterStorageObjects.categories,
                subcategories: stateSnapshot.filterStorageObjects.subcategories,
                traits: stateSnapshot.filterStorageObjects.traits,
            });
            console.log('Inventory:', {
                itemCount: stateSnapshot.currentStock.length,
                items: stateSnapshot.currentStock,
            });
            console.log('================================');
        } catch (err) {
            console.error('Error logging state:', err);
            setError(err);
        }
    };

    if (error) {
        return (
            <div className="ai-assistant-error">
                <h3>Something went wrong</h3>
                <p>{error.message}</p>
                <button onClick={() => setError(null)}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="ai-assistant-container">
            <div className="ai-assistant-content">
                <h2>Oracle Assistant</h2>
                <div className="ai-assistant-ready">
                    Ready to assist you with your shop!
                </div>
                <button 
                    className="ai-assistant-test-button"
                    onClick={handleTestClick}
                >
                    Test State Logger
                </button>
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
