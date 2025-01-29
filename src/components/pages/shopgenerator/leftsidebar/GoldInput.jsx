import { useState } from 'react';
import PropTypes from 'prop-types';
import './GoldInput.css';

function GoldInput({ onChange }) {
    const [goldAmount, setGoldAmount] = useState('');

    const handleChange = (e) => {
        const value = e.target.value;
        setGoldAmount(value);
        const gold = parseFloat(value);
        if (!isNaN(gold) && gold > 0) {
            onChange(gold);
        }
    };

    return (
        <div className="gold-input-container">
            <div className="gold-input-wrapper">
                <div className="input-with-suffix">
                    <input
                        type="number"
                        id="goldAmount"
                        value={goldAmount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter gold amount"
                        required
                    />
                    <span className="suffix">gp</span>
                </div>
            </div>
        </div>
    );
}

GoldInput.propTypes = {
    onChange: PropTypes.func.isRequired,
};

export default GoldInput; 