import { useState, useEffect } from 'react';

/**
 * Custom hook for real-time Firestore data
 * @param {Function} subscribeFunction - Firebase service subscribe function
 * @returns {Object} { data, loading, error }
 */
export const useRealtimeData = (subscribeFunction) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);

        const unsubscribe = subscribeFunction((newData) => {
            setData(newData);
            setLoading(false);
        }, (err) => {
            setError(err);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [subscribeFunction]);

    return { data, loading, error };
};

/**
 * Custom hook for fetching data once
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Array} dependencies - Dependencies array for useEffect
 */
export const useFetchData = (fetchFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await fetchFunction();
                if (isMounted) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, dependencies);

    return { data, loading, error, refetch: fetchFunction };
};
