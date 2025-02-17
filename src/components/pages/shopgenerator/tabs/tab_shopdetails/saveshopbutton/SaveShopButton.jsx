import PropTypes from 'prop-types';
import './SaveShopButton.css';

const SaveShopButton = ({ onSave, areAllDetailsFilled }) => {
    return (
        <button 
            className="save-shop-button"
            onClick={onSave}
            disabled={!areAllDetailsFilled()}
            aria-label="Save"
        >
            <span className="save-icon">&#128427;</span>
            <span className="save-text">Save</span>
        </button>
    );
};

SaveShopButton.propTypes = {
    onSave: PropTypes.func.isRequired,
    areAllDetailsFilled: PropTypes.func.isRequired
};

export default SaveShopButton; 