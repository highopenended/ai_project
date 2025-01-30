import React from 'react';
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
                        <th>Item Name</th>
                        <th>Level</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.level}</td>
                            <td>{item.price}</td>
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
        })
    ).isRequired,
};

export default ItemTable; 