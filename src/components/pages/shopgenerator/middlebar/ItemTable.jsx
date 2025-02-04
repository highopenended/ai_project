import PropTypes from 'prop-types';
import './ItemTable.css';

function ItemTable({ items, sortConfig, onSort }) {
    // Helper function to get the current sort direction for a column
    const getCurrentSortDirection = (columnName) => {
        const sortItem = sortConfig.find(item => item.column === columnName);
        return sortItem ? sortItem.direction : undefined;
    };

    // Helper function to get the sort indicator
    const getSortIndicator = (columnName) => {
        const direction = getCurrentSortDirection(columnName);
        if (!direction) return '↕';
        return direction === 'asc' ? '↑' : '↓';
    };

    // Helper function to get the sort order for a column
    const getSortOrder = (columnName) => {
        const index = sortConfig.findIndex(item => item.column === columnName);
        return index === -1 ? '' : `${index + 1}`;
    };

    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => onSort('count')}>
                            Count {getSortIndicator('count')}
                            <span className="sort-order">{getSortOrder('count')}</span>
                        </th>
                        <th onClick={() => onSort('name')}>
                            Name {getSortIndicator('name')}
                            <span className="sort-order">{getSortOrder('name')}</span>
                        </th>
                        <th onClick={() => onSort('level')}>
                            Level {getSortIndicator('level')}
                            <span className="sort-order">{getSortOrder('level')}</span>
                        </th>
                        <th onClick={() => onSort('price')}>
                            Price {getSortIndicator('price')}
                            <span className="sort-order">{getSortOrder('price')}</span>
                        </th>
                        <th onClick={() => onSort('total')}>
                            Total {getSortIndicator('total')}
                            <span className="sort-order">{getSortOrder('total')}</span>
                        </th>
                        <th onClick={() => onSort('rarity')}>
                            Rarity {getSortIndicator('rarity')}
                            <span className="sort-order">{getSortOrder('rarity')}</span>
                        </th>
                        <th onClick={() => onSort('item_category')}>
                            Category {getSortIndicator('item_category')}
                            <span className="sort-order">{getSortOrder('item_category')}</span>
                        </th>
                        <th onClick={() => onSort('item_subcategory')}>
                            Subcategory {getSortIndicator('item_subcategory')}
                            <span className="sort-order">{getSortOrder('item_subcategory')}</span>
                        </th>
                        <th>Bulk</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={`${item.name}-${index}`}>
                            <td>{item.count}</td>
                            <td>{item.name}</td>
                            <td>{item.level}</td>
                            <td>{item.price}</td>
                            <td>{item.total}</td>
                            <td>{item.rarity}</td>
                            <td>{item.item_category}</td>
                            <td>{item.item_subcategory}</td>
                            <td>{item.bulk}</td>
                            <td>{item.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

ItemTable.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    sortConfig: PropTypes.arrayOf(PropTypes.shape({
        column: PropTypes.string.isRequired,
        direction: PropTypes.oneOf(['asc', 'desc'])
    })).isRequired,
    onSort: PropTypes.func.isRequired
};

export default ItemTable; 