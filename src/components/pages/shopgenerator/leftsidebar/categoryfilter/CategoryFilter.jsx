import { useState } from 'react';
import { useCategoryContext } from '../../../../../context/CategoryContext';
import './CategoryFilter.css';

function CategoryFilter() {
    const {
        categoryData,
        selectedCategories,
        selectedSubcategories,
        toggleCategory,
        toggleSubcategory,
        clearCategorySelections,
        clearSubcategorySelections
    } = useCategoryContext();

    const [categoryFilter, setCategoryFilter] = useState('');
    const [subcategoryFilter, setSubcategoryFilter] = useState('');

    // Get all unique subcategories from selected categories
    const getRelevantSubcategories = () => {
        if (selectedCategories.size === 0) {
            return Object.values(categoryData)
                .flatMap(cat => cat.subcategories)
                .filter((value, index, self) => self.indexOf(value) === index)
                .sort();
        }
        return Array.from(selectedCategories)
            .flatMap(category => categoryData[category]?.subcategories || [])
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
    };

    // Filter categories based on search
    const filteredCategories = Object.keys(categoryData)
        .filter(category => 
            category.toLowerCase().includes(categoryFilter.toLowerCase())
        )
        .sort();

    // Filter subcategories based on search
    const filteredSubcategories = getRelevantSubcategories()
        .filter(subcategory => 
            subcategory.toLowerCase().includes(subcategoryFilter.toLowerCase())
        );

    return (
        <div className="category-filter">
            <div className="category-section">
                <div className="section-header">
                    <h3>Categories</h3>
                    <button 
                        className="reset-button" 
                        onClick={clearCategorySelections}
                    >
                        Reset
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="search-input"
                />
                <div className="tag-container">
                    {filteredCategories.map(category => (
                        <button
                            key={category}
                            className={`tag ${selectedCategories.has(category) ? 'selected' : ''}`}
                            onClick={() => toggleCategory(category)}
                        >
                            {category}
                            <span className="count">({categoryData[category].count})</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="subcategory-section">
                <div className="section-header">
                    <h3>Subcategories</h3>
                    <button 
                        className="reset-button" 
                        onClick={clearSubcategorySelections}
                    >
                        Reset
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Search subcategories..."
                    value={subcategoryFilter}
                    onChange={(e) => setSubcategoryFilter(e.target.value)}
                    className="search-input"
                />
                <div className="tag-container">
                    {filteredSubcategories.map(subcategory => (
                        <button
                            key={subcategory}
                            className={`tag ${selectedSubcategories.has(subcategory) ? 'selected' : ''}`}
                            onClick={() => toggleSubcategory(subcategory)}
                        >
                            {subcategory}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CategoryFilter; 