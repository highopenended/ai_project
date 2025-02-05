import PropTypes from 'prop-types';
import Section from '../components/Section';

const ActionButtonsSection = ({ onGenerate, onSave, areAllDetailsFilled }) => {
    return (
        <Section title="Actions">
            <button 
                className="action-button"
                onClick={onGenerate}
                aria-label="Generate Shop Details"
            >
                Generate Shop Details
            </button>
            <button 
                className="action-button" 
                onClick={onSave} 
                disabled={!areAllDetailsFilled()}
                aria-label="Save Shop"
            >
                Save Shop
            </button>
        </Section>
    );
};

ActionButtonsSection.propTypes = {
    onGenerate: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    areAllDetailsFilled: PropTypes.func.isRequired,
};

export default ActionButtonsSection; 