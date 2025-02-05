import PropTypes from 'prop-types';
import Section from '../../components/Section';
import ButtonGroup from '../../components/ButtonGroup';
import { useState } from 'react';

const ActionButtonsSection = ({ onGenerate, onSave, areAllDetailsFilled }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <Section title="Actions" 
        buttonGroup={<ButtonGroup isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} /> }
        >
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