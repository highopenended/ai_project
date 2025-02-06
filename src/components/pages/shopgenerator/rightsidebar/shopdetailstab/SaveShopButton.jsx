import PropTypes from 'prop-types';
import './SaveShopButton.css';

const SaveShopButton = ({ onSave, areAllDetailsFilled }) => {
    return (
        <button 
            className="save-shop-button" 
            onClick={onSave} 
            disabled={!areAllDetailsFilled()}
            aria-label="Save Shop"
        >
            Save Shop
        </button>
    );
};

SaveShopButton.propTypes = {
    onSave: PropTypes.func.isRequired,
    areAllDetailsFilled: PropTypes.func.isRequired,
};

export default SaveShopButton; 