import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook to stream a Firestore collection in real-time.
 * @param {string} collectionName - Name of the collection (e.g., 'projects')
 * @param {Array} updatedQueryConstraints - Array of query constraints (where, orderBy, limit, etc.)
 */
export const useStreamCollection = (collectionName, ...queryConstraints) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        const ref = collection(db, collectionName);
        const q = query(ref, ...queryConstraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(items);
            setLoading(false);
        }, (err) => {
            console.error(`Error streaming ${collectionName}:`, err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, JSON.stringify(queryConstraints)]); // Re-run if query changes

    return { data, loading, error };
};
