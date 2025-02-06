import PropTypes from 'prop-types';
import './Section.css';

const Section_OneLine = ({ title, children}) => {
    return (
        <div className="section-oneline">
            <div className="section-header">
                {title && <h3>{title}</h3>}
                {children}
            </div>
        </div>
    );
};


Section_OneLine.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
};


export default Section_OneLine;