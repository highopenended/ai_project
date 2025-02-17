import PropTypes from "prop-types";
import "./Section.css";

const Section = ({ title, miniButtonGroup, children }) => {
    return (
        <div className="section">

            {/* If title or miniButtonGroup is missing, do inline styling */}
            <div className="section-header">
                {title && <h3>{title}</h3>}
                {miniButtonGroup && miniButtonGroup}
                {(!title || !miniButtonGroup) && children}
            </div>

            {/* Full size section with title and button group */}
            {title && miniButtonGroup && children}
            
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
    miniButtonGroup: PropTypes.node,
};

export default Section;
