import PropTypes from 'prop-types';

const TabArea = ({ activeTab, setActiveTab }) => {
    return (
        <div className="tab-header">
            <button 
                className={`tab-button ${activeTab === 'chooseShop' ? 'active' : ''}`}
                onClick={() => setActiveTab('chooseShop')}
            >
                Choose Shop
            </button>
            <button 
                className={`tab-button ${activeTab === 'shopDetails' ? 'active' : ''}`}
                onClick={() => setActiveTab('shopDetails')}
            >
                Shop Details
            </button>
        </div>
    );
};

TabArea.propTypes = {
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
};

export default TabArea; 