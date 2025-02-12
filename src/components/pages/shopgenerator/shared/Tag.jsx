import PropTypes from 'prop-types';
import { SELECTION_STATES } from '../../../../context/shopGeneratorConstants';
import './Tag.css';

const Tag = ({ name, state, onClick }) => {
    const getTagClassName = (state) => {
        const baseClass = 'tag';
        switch (state) {
            case SELECTION_STATES.INCLUDE:
                return `${baseClass} include`;
            case SELECTION_STATES.EXCLUDE:
                return `${baseClass} exclude`;
            default:
                return baseClass;
        }
    };

    return (
        <button className={getTagClassName(state)} onClick={onClick}>{name}</button>
    );
};

Tag.propTypes = {
    name: PropTypes.string.isRequired,
    state: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default Tag;
