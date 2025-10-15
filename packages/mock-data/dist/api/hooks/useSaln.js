'use client';
import { useState, useEffect, useCallback } from 'react';
import { MockDatabase } from '../../data';
import { storage } from '../../utils/storage';
/**
 * Mock SALN submissions hook
 * Manages SALN (Statement of Assets, Liabilities, Net Worth) submissions
 */
export function useSaln(userId) {
    const [submissions, setSubmissions] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchSubmissions = useCallback(() => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            setTimeout(() => {
                const userSubmissions = MockDatabase.getSalnByUser(userId);
                setSubmissions(userSubmissions);
                const latestSubmission = userSubmissions.sort((a, b) => b.year - a.year)[0] || null;
                setLatest(latestSubmission);
                setLoading(false);
            }, 300);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch SALN submissions');
            setLoading(false);
        }
    }, [userId]);
    useEffect(() => {
        if (userId) {
            fetchSubmissions();
        }
    }, [userId, fetchSubmissions]);
    const getCompleteSubmission = useCallback((id) => {
        const result = MockDatabase.getCompleteSaln(id);
        return result;
    }, []);
    const createDraft = useCallback(async (year) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const newSubmission = {
            id: `saln-${Date.now()}`,
            userId,
            year,
            status: 'draft',
            totalAssets: '0',
            totalLiabilities: '0',
            netWorth: '0',
            submittedAt: null,
            approvedBy: null,
            approvedAt: null,
            filingType: 'separate',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Store in localStorage
        const key = `saln_draft_${newSubmission.id}`;
        storage.set(key, newSubmission);
        fetchSubmissions();
        return newSubmission;
    }, [userId, fetchSubmissions]);
    const updateSubmission = useCallback(async (id, data) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const key = `saln_draft_${id}`;
        const existing = storage.get(key) || {};
        // Calculate totals if properties/liabilities are updated
        let totalAssets = Number(existing.submission?.totalAssets || '0');
        let totalLiabilities = Number(existing.submission?.totalLiabilities || '0');
        if (data.realProperties) {
            const realPropertiesTotal = data.realProperties.reduce((sum, prop) => sum + Number(prop.currentFairMarketValue || 0), 0);
            totalAssets += realPropertiesTotal;
        }
        if (data.personalProperties) {
            const personalPropertiesTotal = data.personalProperties.reduce((sum, prop) => sum + Number(prop.acquisitionCost || 0), 0);
            totalAssets += personalPropertiesTotal;
        }
        if (data.liabilities) {
            totalLiabilities = data.liabilities.reduce((sum, liability) => sum + Number(liability.outstandingBalance || 0), 0);
        }
        const netWorth = totalAssets - totalLiabilities;
        const updated = {
            ...existing,
            ...data,
            submission: {
                ...existing.submission,
                ...data.submission,
                totalAssets: totalAssets.toFixed(2),
                totalLiabilities: totalLiabilities.toFixed(2),
                netWorth: netWorth.toFixed(2),
            },
        };
        storage.set(key, updated);
        fetchSubmissions();
        return true;
    }, [fetchSubmissions]);
    const submitForReview = useCallback(async (id) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const submission = submissions.find(s => s.id === id);
        if (!submission)
            return false;
        const updated = {
            ...submission,
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
        };
        const key = `saln_draft_${id}`;
        storage.set(key, updated);
        fetchSubmissions();
        return true;
    }, [submissions, fetchSubmissions]);
    return {
        submissions,
        latest,
        loading,
        error,
        getCompleteSubmission,
        createDraft,
        updateSubmission,
        submitForReview,
        refetch: fetchSubmissions,
    };
}
