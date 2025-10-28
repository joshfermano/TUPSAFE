'use client';

import React from 'react';
import { useAuth } from '../context';
import type { Role } from '@tupsafe/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: Role;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  requiredPermission,
  fallback,
  onUnauthorized,
}: ProtectedRouteProps) {
  const { user, profile, loading, hasRole, hasPermission } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    if (onUnauthorized) {
      onUnauthorized();
      return null;
    }
    
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Check if profile exists (required for role/permission checks)
  if (requireAuth && user && !profile) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Setup Required</h2>
          <p className="text-gray-600 mb-4">Your account needs to be configured by an administrator.</p>
          <p className="text-sm text-gray-500">Please contact your system administrator for access.</p>
        </div>
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    if (onUnauthorized) {
      onUnauthorized();
      return null;
    }

    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">Required role: {requiredRole}</p>
        </div>
      </div>
    );
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (onUnauthorized) {
      onUnauthorized();
      return null;
    }

    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to perform this action.</p>
          <p className="text-sm text-gray-500">Required permission: {requiredPermission}</p>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}