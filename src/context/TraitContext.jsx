import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const TraitContext = createContext();

export function TraitProvider({ children }) {
    const [selectedTraits, setSelectedTraits] = useState(new Set());

    const toggleTrait = (trait) => {
        setSelectedTraits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(trait)) {
                newSet.delete(trait);
            } else {
                newSet.add(trait);
            }
            return newSet;
        });
    };

    const clearTraitSelections = () => {
        setSelectedTraits(new Set());
    };

    return (
        <TraitContext.Provider value={{
            selectedTraits,
            toggleTrait,
            clearTraitSelections
        }}>
            {children}
        </TraitContext.Provider>
    );
}

TraitProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useTraitContext() {
    const context = useContext(TraitContext);
    if (!context) {
        throw new Error('useTraitContext must be used within a TraitProvider');
    }
    return context;
} 