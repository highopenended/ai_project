import PropTypes from 'prop-types';

function FormattedMessage({ content, role }) {
    const formatContent = (text) => {
        if (role === 'user') return text;

        return text
            // First, handle headers
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            
            // Handle section headers (bold text at start of line)
            .replace(/^\*\*(.*?)\*\*$/gm, '<h4>$1</h4>')
            
            // Handle numbered items with bold
            .replace(/^(\d+)\. \*\*(.*?)\*\*/gm, '<div class="numbered-item"><span class="number">$1.</span> <strong>$2</strong></div>')
            
            // Handle bullet points
            .replace(/^- (.*?)$/gm, '<li>$1</li>')
            
            // Handle remaining bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            
            // Handle separators
            .replace(/^---$/gm, '<hr>')
            .replace(/^--$/gm, '<div class="subseparator"></div>')
            
            // Wrap bullet points in ul
            .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
            
            // Handle paragraphs (lines not already wrapped in HTML)
            .replace(/^(?!<[a-z].*>)(.+)$/gm, '<p>$1</p>')
            
            // Clean up extra newlines
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    return (
        <div 
            className={`message ${role === 'user' ? 'user-message' : 'assistant-message'}`}
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />
    );
}

FormattedMessage.propTypes = {
    content: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['user', 'assistant']).isRequired
};

export default FormattedMessage; 