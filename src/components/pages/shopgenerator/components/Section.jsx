import PropTypes from 'prop-types';
import '../ShopGenerator.css';

const Section = ({ title, children }) => {
    return (
        <div className="section-header">
            <h3 className="section-header">{title}</h3>
            {children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
};

export default Section;