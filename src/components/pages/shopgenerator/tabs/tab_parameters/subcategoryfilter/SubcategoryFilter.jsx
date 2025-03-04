import { useState } from "react";
import PropTypes from 'prop-types';
import { SELECTION_STATES } from "../../../utils/shopGeneratorConstants";
import Section from "../../../shared/section/Section";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import SearchBar from "../../../shared/searchbar/SearchBar";
import TagContainer from "../../../shared/TagContainer";
import { getFilteredSubcategories } from "../../../utils/filterGroupUtils";

function SubcategoryFilter({ categoryData, categoryStates, getFilterState, toggleSubcategory, clearSubcategorySelections }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredSubcategories = getFilteredSubcategories(
        categoryData, 
        categoryStates, 
        searchTerm, 
        SELECTION_STATES.INCLUDE
    );

    return (
        <Section
            title="Subcategories"
            miniButtonGroup={
                <MiniButtonGroup
                    handleReset={clearSubcategorySelections}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
            }
        >
            {!isCollapsed && (
                <SearchBar
                    placeholder="Search subcategories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            )}
            {!isCollapsed && (
                <TagContainer
                    tags={filteredSubcategories}
                    onTagClick={toggleSubcategory}
                    getTagState={(subcategory) => getFilterState('subcategories', subcategory)}
                />
            )}
        </Section>
    );
}

SubcategoryFilter.propTypes = {
    categoryData: PropTypes.object.isRequired,
    categoryStates: PropTypes.object.isRequired,
    getFilterState: PropTypes.func.isRequired,
    toggleSubcategory: PropTypes.func.isRequired,
    clearSubcategorySelections: PropTypes.func.isRequired
};

export default SubcategoryFilter;
