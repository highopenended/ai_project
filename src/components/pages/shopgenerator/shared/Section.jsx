import PropTypes from "prop-types";
import "./Section.css";

const Section = ({ title, buttonGroup, children }) => {
    return (
        <div className="section">

            {/* If title or buttonGroup is missing, do inline styling */}
            <div className="section-header">
                {title && <h3>{title}</h3>}
                {buttonGroup && buttonGroup}
                {(!title || !buttonGroup) && children}
            </div>

            {/* Full size section with title and button group */}
            {title && buttonGroup && children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
    buttonGroup: PropTypes.node,
};

export default Section;
