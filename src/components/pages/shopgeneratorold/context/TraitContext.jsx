import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const TraitContext = createContext();

export const TRAIT_STATES = {
    IGNORE: 0,
    INCLUDE: 1,
    EXCLUDE: -1
};

export function TraitProvider({ children }) {
    const [traitStates, setTraitStates] = useState(new Map());

    const toggleTrait = (trait) => {
        setTraitStates(prev => {
            const newMap = new Map(prev);
            const currentState = prev.get(trait) || TRAIT_STATES.IGNORE;
            
            // Cycle through states: IGNORE -> INCLUDE -> EXCLUDE -> IGNORE
            let nextState;
            if (currentState === TRAIT_STATES.IGNORE) {
                nextState = TRAIT_STATES.INCLUDE;
            } else if (currentState === TRAIT_STATES.INCLUDE) {
                nextState = TRAIT_STATES.EXCLUDE;
            } else {
                nextState = TRAIT_STATES.IGNORE;
            }

            if (nextState === TRAIT_STATES.IGNORE) {
                newMap.delete(trait);
            } else {
                newMap.set(trait, nextState);
            }
            
            return newMap;
        });
    };

    const clearTraitSelections = () => {
        setTraitStates(new Map());
    };

    const getTraitState = (trait) => {
        return traitStates.get(trait) || TRAIT_STATES.IGNORE;
    };

    return (
        <TraitContext.Provider value={{
            traitStates,
            getTraitState,
            toggleTrait,
            clearTraitSelections,
            setTraitStates
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