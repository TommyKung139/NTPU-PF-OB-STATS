'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export function StoreInitializer() {
    const { fetchData } = useStore();

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return null;
}
