import PropTypes from 'prop-types';
import './ChangesInnerWrapper.css';

const ChangesInnerWrapper = ({
    beforeElement,
    afterElement,
    className = ''
}) => {
    return (
        <div className={`changes-inner-wrapper ${className}`}>
            <div className="changes-before">
                {beforeElement}
            </div>
            <div className="changes-after">
                {afterElement}
            </div>
        </div>
    );
};

ChangesInnerWrapper.propTypes = {
    beforeElement: PropTypes.element,
    afterElement: PropTypes.element,
    className: PropTypes.string
};

export default ChangesInnerWrapper; 