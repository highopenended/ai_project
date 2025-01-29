import React, { useState } from 'react';
import PropTypes from 'prop-types';

function GoldInput({ onSubmit }) {
    const [goldAmount, setGoldAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const gold = parseFloat(goldAmount);
        if (!isNaN(gold) && gold > 0) {
            onSubmit(gold);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="shop-parameter-form">
            <label htmlFor="goldAmount">Gold Amount:</label>
            <input
                type="number"
                id="goldAmount"
                value={goldAmount}
                onChange={(e) => setGoldAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Enter gold amount"
                required
            />
            <button type="submit">
                Generate Shop
            </button>
        </form>
    );
}

GoldInput.propTypes = {
    onSubmit: PropTypes.func.isRequired,
};

export default GoldInput; 