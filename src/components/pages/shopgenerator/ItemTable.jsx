import PropTypes from 'prop-types';
import './ItemTable.css';

function ItemTable({ items }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="item-table-container">
            <table className="item-table">
                <thead>
                    <tr>
                        <th>Count</th>
                        <th>Item Name</th>
                        <th>Level</th>
                        <th>Price</th>
                        <th>Total</th>
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
};

export default ItemTable; 