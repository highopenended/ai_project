import { useState } from "react";
import { useShopGenerator } from "../../../utils/shopGeneratorContext";
import Section from "../../../shared/section/Section";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import SearchBar from "../../../shared/searchbar/SearchBar";
import TagContainer from "../../../shared/TagContainer";

function CategoryFilter() {
    const { categoryData, getCategoryState, toggleCategory, clearCategorySelections } = useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCategories = Object.entries(categoryData.categories)
        .filter(([category]) =>
            category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category]) => ({
            name: category
        }));

    return (
        <Section
            title="Categories"
            miniButtonGroup={
                <MiniButtonGroup handleReset={clearCategorySelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            {!isCollapsed && (
                <SearchBar
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            )}
            {!isCollapsed && (
                <TagContainer
                    tags={filteredCategories}
                    onTagClick={toggleCategory}
                    getTagState={getCategoryState}
                />
            )}
        </Section>
    );
}

export default CategoryFilter;
