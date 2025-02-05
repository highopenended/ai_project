import { useState } from 'react';
import { useCategoryContext, SELECTION_STATES } from '../../context/CategoryContext';
import './SubcategoryFilter.css';
import DropdownArrow from '../../components/DropdownArrow';
import TagContainer from '../../components/TagContainer';
import ResetButton from '../../components/ResetButton';

function SubcategoryFilter() {
    const {
        categoryData,
        getCategoryState,
        getSubcategoryState,
        toggleSubcategory,
        clearSubcategorySelections
    } = useCategoryContext();

    const [subcategoryFilter, setSubcategoryFilter] = useState('');
    const [isSubcategoryCollapsed, setIsSubcategoryCollapsed] = useState(false);

    // Get all unique subcategories from selected categories
    const getRelevantSubcategories = () => {
        const includedCategories = Object.keys(categoryData).filter(
            cat => getCategoryState(cat) === SELECTION_STATES.INCLUDE
        );

        if (includedCategories.length === 0) {
            return Object.values(categoryData)
                .flatMap(cat => cat.subcategories)
                .filter((value, index, self) => self.indexOf(value) === index)
                .sort();
        }
        return includedCategories
            .flatMap(category => categoryData[category]?.subcategories || [])
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
    };

    // Filter subcategories based on search
    const filteredSubcategories = getRelevantSubcategories()
        .filter(subcategory => 
            subcategory.toLowerCase().includes(subcategoryFilter.toLowerCase())
        );

    // Define getTagClassName function
    const getTagClassName = (state) => {
        const baseClass = 'tag';
        if (state === 'INCLUDE') return `${baseClass} included`;
        if (state === 'EXCLUDE') return `${baseClass} excluded`;
        return baseClass;
    };

    return (
        <div className="subcategory-section">
            <div className="section-header">
                <h3>Subcategories</h3>
                <div className="buttons">
                    <ResetButton 
                        onClick={clearSubcategorySelections}
                        title="Reset subcategory selections"
                    />
                    <DropdownArrow isCollapsed={isSubcategoryCollapsed} toggleCollapse={() => setIsSubcategoryCollapsed(!isSubcategoryCollapsed)} />
                </div>
            </div>
            {!isSubcategoryCollapsed && (
                <>
                    <input
                        type="text"
                        placeholder="Search subcategories..."
                        value={subcategoryFilter}
                        onChange={(e) => setSubcategoryFilter(e.target.value)}
                        className="search-input"
                    />
                    <TagContainer 
                        tags={filteredSubcategories.map(subcategory => ({
                            name: subcategory,
                            state: getSubcategoryState(subcategory),
                            count: 0 // Assuming count is not used here
                        }))}
                        onTagClick={toggleSubcategory}
                        getTagClassName={getTagClassName}
                    />
                </>
            )}
        </div>
    );
}

export default SubcategoryFilter; 