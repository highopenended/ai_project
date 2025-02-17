import { useState } from "react";
import { useShopGenerator } from "../../../utils/shopGeneratorContext";
import { SELECTION_STATES } from "../../../utils/shopGeneratorConstants";
import Section from "../../../shared/Section";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import SearchBar from "../../../shared/SearchBar";
import TagContainer from "../../../shared/TagContainer";

function SubcategoryFilter() {
    const { categoryData, categoryStates, getSubcategoryState, toggleSubcategory, clearSubcategorySelections } =
        useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Get all subcategories - either from selected categories or all categories if none selected
    const subcategories = new Set();
    const hasSelectedCategories = Array.from(categoryStates.values()).some(state => state === SELECTION_STATES.INCLUDE);
    
    Object.entries(categoryData.categories).forEach(([category, data]) => {
        if (!hasSelectedCategories || categoryStates.get(category) === SELECTION_STATES.INCLUDE) {
            data.subcategories.forEach((subcategory) => subcategories.add(subcategory));
        }
    });

    const filteredSubcategories = Array.from(subcategories)
        .filter(subcategory =>
            subcategory.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.localeCompare(b))
        .map(subcategory => ({
            name: subcategory
        }));

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
                    getTagState={getSubcategoryState}
                />
            )}
        </Section>
    );
}

export default SubcategoryFilter;
