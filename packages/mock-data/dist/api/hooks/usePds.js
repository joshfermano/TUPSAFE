'use client';
import { useState, useEffect, useCallback } from 'react';
import { MockDatabase } from '../../data';
import { storage } from '../../utils/storage';
/**
 * Mock PDS submissions hook
 * Manages PDS (Personal Data Sheet) submissions with CRUD operations
 */
export function usePds(userId) {
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
                const userSubmissions = MockDatabase.getPdsByUser(userId);
                setSubmissions(userSubmissions);
                const latestSubmission = userSubmissions
                    .filter((pds) => pds.isLatest)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
                setLatest(latestSubmission);
                setLoading(false);
            }, 300);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch PDS submissions');
            setLoading(false);
        }
    }, [userId]);
    useEffect(() => {
        if (userId) {
            fetchSubmissions();
        }
    }, [userId, fetchSubmissions]);
    const getCompleteSubmission = useCallback((id) => {
        const result = MockDatabase.getCompletePds(id);
        return result;
    }, []);
    const createDraft = useCallback(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const newSubmission = {
            id: `pds-${Date.now()}`,
            userId,
            version: 1,
            status: 'draft',
            submittedAt: null,
            approvedBy: null,
            approvedAt: null,
            isLatest: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Store in localStorage
        const key = `pds_draft_${newSubmission.id}`;
        storage.set(key, newSubmission);
        fetchSubmissions();
        return newSubmission;
    }, [userId, fetchSubmissions]);
    const updateSubmission = useCallback(async (id, data) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const key = `pds_draft_${id}`;
        const existing = storage.get(key) || {};
        storage.set(key, { ...existing, ...data });
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
        const key = `pds_draft_${id}`;
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
