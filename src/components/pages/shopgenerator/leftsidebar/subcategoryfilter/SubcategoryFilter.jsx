import { useState } from 'react';
import { useCategoryContext, SELECTION_STATES } from '../../context/CategoryContext';
import './SubcategoryFilter.css';
import DropdownArrow from '../../components/DropdownArrow';
import TagContainer from '../../components/TagContainer';

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
                    <button 
                        className="reset-button" 
                        onClick={clearSubcategorySelections}
                        title="Reset subcategory selections"
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