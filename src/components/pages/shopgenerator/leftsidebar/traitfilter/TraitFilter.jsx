import { useState } from 'react';
import { useTraitContext } from '../../../../../context/TraitContext';
import traitList from '../../../../../../public/trait-list.json';
import './TraitFilter.css';

function TraitFilter() {
    const {
        selectedTraits,
        toggleTrait,
        clearTraitSelections
    } = useTraitContext();

    const [traitFilter, setTraitFilter] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Filter traits based on search
    const filteredTraits = traitList
        .map(trait => trait.Trait)
        .filter(trait => 
            trait.toLowerCase().includes(traitFilter.toLowerCase())
        )
        .sort();

    return (
        <div className="trait-filter">
            <div className="trait-section">
                <div className="section-header">
                    <h3>Traits</h3>
                    <div className="buttons">
                        <button 
                            className="reset-button" 
                            onClick={clearTraitSelections}
                            title="Reset trait selections"
                        >
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                        <button
                            className={`collapse-button ${isCollapsed ? 'collapsed' : ''}`}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            title={isCollapsed ? "Expand traits" : "Collapse traits"}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 10l5 5 5-5H7z"
                                    fill="currentColor"
                                />
                            </svg>
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
                        <div className="tag-container">
                            {filteredTraits.map(trait => (
                                <button
                                    key={trait}
                                    className={`tag ${selectedTraits.has(trait) ? 'selected' : ''}`}
                                    onClick={() => toggleTrait(trait)}
                                    title={traitList.find(t => t.Trait === trait)?.Description || ''}
                                >
                                    {trait}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default TraitFilter; 