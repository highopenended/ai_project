import PropTypes from 'prop-types';
import './Section.css';


const Section = ({ title, buttonGroup, children}) => {
    return (
        <div className="section">
            <div className="section-header">
                <h3 className="section-header">{title}</h3>
                {buttonGroup && buttonGroup}
            </div>
            {children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    buttonGroup: PropTypes.node,
};

export default Section;