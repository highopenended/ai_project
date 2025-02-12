import { useShopGenerator } from "../../../../../context/ShopGeneratorContext";
import Tag from "../../shared/Tag";
import Section from "../../shared/Section";

function CategoryFilter() {
    const { categoryData, getCategoryState, toggleCategory, clearCategorySelections } = useShopGenerator();

    return (
        <Section title="Categories">
            <div className="filter-grid">
                {Object.entries(categoryData).map(([category, data]) => (
                    <Tag
                        name={`${category} (${data.count})`}
                        key={category}
                        state={getCategoryState(category)}
                        onClick={() => toggleCategory(category)}
                    />
                ))}
            </div>
            <button onClick={clearCategorySelections} className="clear-button">
                Clear Categories
            </button>
        </Section>
    );
}

export default CategoryFilter;
