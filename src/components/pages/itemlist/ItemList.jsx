import { useState, useEffect } from 'react';
import './ItemList.css';
import itemData from '../../../../public/item-table.json';  // Import JSON directly

function ItemList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Generate a unique key for each item using name and ID from URL
    const generateItemKey = (item) => {
        const idMatch = item.url.match(/ID=(\d+)/);
        const id = idMatch ? idMatch[1] : '';
        return `${item.name}-${id}`.replace(/\s+/g, '-');
    };

    useEffect(() => {
        try {
            // Format the data
            const formattedData = itemData.map(item => ({
                ...item,
                bulk: item.bulk?.trim() === '' ? '-' : item.bulk,
                level: item.level ? Number(item.level) : 0
            }));
            
            setItems(formattedData);
            setLoading(false);
        } catch (err) {
            console.error('Error processing items:', err);
            setError('Failed to load items');
            setLoading(false);
        }
    }, []);

    // Get current items for the page
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="loading-message">Loading items...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="content-area">
            <div className="content-container">
                <h1 className="page-title">Items List</h1>
                <div>
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {items.length > 0 && Object.keys(items[0]).map(key => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item) => (
                                <tr key={generateItemKey(item)}>
                                    {Object.values(item).map((value, index) => (
                                        <td key={`${generateItemKey(item)}-${index}`}>
                                            {typeof value === 'object' ? JSON.stringify(value) : value}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemList; 