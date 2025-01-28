import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './itemlist/ItemList.css';

function ItemList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsCollection = collection(db, 'item-table');
                const snapshot = await getDocs(itemsCollection);
                const itemsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setItems(itemsList);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching items:', err);
                setError('Failed to load items');
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    if (loading) return <div className="loading-message">Loading items...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="content-container">
            <h1 className="page-title">Items List</h1>
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
                        {items.map((item) => (
                            <tr key={item.id}>
                                {Object.values(item).map((value, index) => (
                                    <td key={index}>
                                        {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ItemList; 