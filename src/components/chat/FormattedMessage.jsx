import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

function FormattedMessage({ content, role }) {
    const formatContent = (text) => {
        if (role === 'user') return text;

        // Configure marked for safe and limited markdown
        marked.setOptions({
            breaks: false,
            gfm: true,
            headerIds: false,
            mangle: false
        });

        // Clean up excessive newlines and format numbered items
        const cleanedText = text
            .replace(/\n{3,}/g, '\n\n')
            // Only remove asterisks from numbered items at the start of lines
            .replace(/^\*\*(\d+)\./gm, '$1.');

        // Convert markdown to HTML and sanitize
        const rawHtml = marked(cleanedText);
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'hr'],
            ALLOWED_ATTR: []
        });

        return cleanHtml;
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