import PropTypes from 'prop-types';
import './ItemTable.css';

function ItemTable({ items, sortConfig, onSort }) {
    if (!items || items.length === 0) {
        return null;
    }

    // Helper function to get sort indicator and order
    const getSortInfo = (columnName) => {
        const sortItem = sortConfig.find(item => item.column === columnName);
        if (!sortItem) return { indicator: '', order: 0 };
        
        const order = sortConfig.findIndex(item => item.column === columnName) + 1;
        return {
            indicator: sortItem.direction === 'asc' ? '↑' : '↓',
            order: sortConfig.length > 1 ? order : 0
        };
    };

    // Helper function to render column header with sort indicator
    const renderColumnHeader = (columnName, displayName) => {
        const { indicator, order } = getSortInfo(columnName);
        return (
            <th onClick={() => onSort(columnName)} className="sortable-header">
                {displayName}
                <span className="sort-indicator">
                    {indicator}
                    {order > 0 && <sup>{order}</sup>}
                </span>
            </th>
        );
    };

    return (
        <div className="item-table-container">
            <table className="item-table">
                <thead>
                    <tr>
                        {renderColumnHeader('count', 'Count')}
                        {renderColumnHeader('name', 'Item Name')}
                        {renderColumnHeader('level', 'Level')}
                        {renderColumnHeader('price', 'Price')}
                        {renderColumnHeader('total', 'Total')}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={`${item.url}-${index}`}>
                            <td>{item.count}</td>
                            <td>{item.name}</td>
                            <td>{item.level}</td>
                            <td>{item.price}</td>
                            <td>{item.total} gp</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

ItemTable.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            level: PropTypes.string.isRequired,
            price: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            total: PropTypes.number.isRequired,
            url: PropTypes.string.isRequired,
        })
    ).isRequired,
    sortConfig: PropTypes.arrayOf(
        PropTypes.shape({
            column: PropTypes.string.isRequired,
            direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
        })
    ).isRequired,
    onSort: PropTypes.func.isRequired,
};

export default ItemTable; 