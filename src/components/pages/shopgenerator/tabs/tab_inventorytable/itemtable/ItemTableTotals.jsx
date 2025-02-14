import React from 'react';
import PropTypes from 'prop-types';
import { RARITY_COLORS } from '../../../../../../constants/rarityColors';
import './ItemTableTotals.css';

function ItemTableTotals({ totalCount, uniqueCount, rarityCounts, avgLevel, avgPrice, totalPrice }) {
    // Helper function to format decimal gold pieces
    const formatDecimalGold = (amount) => {
        if (amount === 0) return "0.00 gp";
        const [whole, decimal] = amount.toFixed(2).split(".");
        const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return (
            <>
                {wholeWithCommas}
                <span className="decimal-part">.{decimal}</span> gp
            </>
        );
    };

    return (
        <div className="table-totals">
            <div className="totals-content">
                <div className="total-item counts-group">
                    <div className="total-row">
                        <span className="total-label">Items:</span>
                        <span className="total-value">
                            <span className="count-prefix">×</span>
                            {totalCount}
                        </span>
                        <span className="total-label unique-count">({uniqueCount} unique)</span>
                    </div>
                    <div className="rarity-count-list">
                        {Object.entries(rarityCounts).map(([rarity, count], index) => (
                            <React.Fragment key={`${rarity}-${index}`}>
                                {index > 0 && <div className="rarity-separator" />}
                                <span className={`rarity-count rarity-${rarity.toLowerCase()}`} style={{ color: RARITY_COLORS[rarity] }}>
                                    {count} {rarity}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="totals-divider" />
                <div className="total-item">
                    <span className="total-label">Avg Level:</span>
                    <span className="total-value">{avgLevel.toFixed(1)}</span>
                </div>
                
                <div className="totals-divider" />
                <div className="total-item">
                    <span className="total-label">Avg Price:</span>
                    <span className="total-value">{formatDecimalGold(avgPrice)}</span>
                </div>
                
                <div className="totals-divider" />
                <div className="total-item">
                    <span className="total-label">Total Value:</span>
                    <span className="total-value">{formatDecimalGold(totalPrice)}</span>
                </div>
            </div>
        </div>
    );
}

ItemTableTotals.propTypes = {
    totalCount: PropTypes.number.isRequired,
    uniqueCount: PropTypes.number.isRequired,
    rarityCounts: PropTypes.objectOf(PropTypes.number).isRequired,
    avgLevel: PropTypes.number.isRequired,
    avgPrice: PropTypes.number.isRequired,
    totalPrice: PropTypes.number.isRequired,
};

export default ItemTableTotals; 