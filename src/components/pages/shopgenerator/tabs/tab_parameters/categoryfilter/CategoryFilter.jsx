import { useState } from "react";
import { useShopGenerator } from "../../../../../../context/ShopGeneratorContext";
import Tag from "../../../shared/Tag";
import Section from "../../../shared/Section";
import ButtonGroup from "../../../shared/ButtonGroup";
import SearchBar from "../../../shared/SearchBar";

function CategoryFilter() {
    const { categoryData, getCategoryState, toggleCategory, clearCategorySelections } = useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCategories = Object.entries(categoryData.categories).filter(([category]) =>
        category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Section
            title="Categories"
            buttonGroup={
                <ButtonGroup handleReset={clearCategorySelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
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
            <div className="filter-grid">
                {!isCollapsed && (
                    <div className="filter-grid-content">
                        {filteredCategories.map(([category, data], index) => (
                            <Tag
                                name={`${category} (${data.count})`}
                                key={category + index}
                                state={getCategoryState(category)}
                                onClick={() => toggleCategory(category)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

export default CategoryFilter;
