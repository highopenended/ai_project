import { useState } from 'react';
import { useTraitContext, TRAIT_STATES } from '../../context/TraitContext';
import traitList from '../../../../../../public/trait-list.json';
import './TraitFilter.css';
import DropdownArrow from '../../components/DropdownArrow';
import TagContainer from '../../components/TagContainer';
import ResetButton from '../../components/ResetButton';

function TraitFilter() {
    const {
        getTraitState,
        toggleTrait,
        clearTraitSelections
    } = useTraitContext();

    const [traitFilter, setTraitFilter] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Filter traits based on search and remove duplicates
    const filteredTraits = Array.from(new Set(
        traitList
            .map(trait => trait.Trait)
            .filter(trait => 
                trait.toLowerCase().includes(traitFilter.toLowerCase())
            )
    )).sort();

    // Define getTagClassName function
    const getTagClassName = (state) => {
        const baseClass = 'tag';
        if (state === 'INCLUDE') return `${baseClass} included`;
        if (state === 'EXCLUDE') return `${baseClass} excluded`;
        return baseClass;
    };

    // Ensure getTraitState returns a string
    const getTraitStateString = (trait) => {
        const state = getTraitState(trait);
        return state === TRAIT_STATES.INCLUDE ? 'INCLUDE' :
               state === TRAIT_STATES.EXCLUDE ? 'EXCLUDE' : 'NONE';
    };

    return (
        <div className="trait-filter">
            <div className="trait-section">
                <div className="section-header">
                    <h3>Traits</h3>
                    <div className="buttons">
                        <ResetButton onClick={clearTraitSelections} title="Reset trait selections"/>   
                        <DropdownArrow isCollapsed={isSubcategoryCollapsed} toggleCollapse={() => setIsSubcategoryCollapsed(!isSubcategoryCollapsed)} />
                
                        <button
                            className={`collapse-button ${isCollapsed ? 'collapsed' : ''}`}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            title={isCollapsed ? 'Expand traits' : 'Collapse traits'}
                        >
                            
                            <DropdownArrow isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
                        </button>
                    </div>
                </div>
                {!isCollapsed && (
                    <>
                        <input
                            type="text"
                            placeholder="Search traits..."
                            value={traitFilter}
                            onChange={(e) => setTraitFilter(e.target.value)}
                            className="search-input"
                        />
                        <TagContainer 
                            tags={filteredTraits.map(trait => ({
                                name: trait,
                                state: getTraitStateString(trait),
                                count: 0 // Assuming count is not used here
                            }))}
                            onTagClick={toggleTrait}
                            getTagClassName={getTagClassName}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default TraitFilter; 