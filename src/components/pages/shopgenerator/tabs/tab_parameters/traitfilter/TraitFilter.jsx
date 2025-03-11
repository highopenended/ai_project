import { useState } from "react";
import PropTypes from 'prop-types';
import Section from "../../../shared/section/Section";
import traitList from "../../../../../../../src/data/trait-list.json";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import SearchBar from "../../../shared/searchbar/SearchBar";
import TagContainer from "../../../shared/tagcontainer/TagContainer";
import { getFilteredTraits } from "../../../utils/filterGroupUtils";

function TraitFilter({ getFilterState, toggleTrait, clearTraitSelections }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTraits = getFilteredTraits(traitList, searchTerm);

    return (
        <Section title="Traits"
            miniButtonGroup={
                <MiniButtonGroup handleReset={clearTraitSelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            {!isCollapsed && (
                <SearchBar
                    placeholder="Search traits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            )}
            {!isCollapsed && (
                <TagContainer
                    tags={filteredTraits}
                    onTagClick={toggleTrait}
                    getTagState={(trait) => getFilterState('traits', trait)}
                />
            )}
        </Section>
    );
}

TraitFilter.propTypes = {
    getFilterState: PropTypes.func.isRequired,
    toggleTrait: PropTypes.func.isRequired,
    clearTraitSelections: PropTypes.func.isRequired
};

export default TraitFilter;
