'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from '../context';
export function ProtectedRoute({ children, requireAuth = true, requiredRole, requiredPermission, fallback, onUnauthorized, }) {
    const { user, profile, loading, hasRole, hasPermission } = useAuth();
    // Show loading state while checking authentication
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    // Check if authentication is required
    if (requireAuth && !user) {
        if (onUnauthorized) {
            onUnauthorized();
            return null;
        }
        return fallback || (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Authentication Required" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please sign in to access this page." }), _jsx("a", { href: "/auth/login", className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Sign In" })] }) }));
    }
    // Check if profile exists (required for role/permission checks)
    if (requireAuth && user && !profile) {
        return fallback || (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Profile Setup Required" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Your account needs to be configured by an administrator." }), _jsx("p", { className: "text-sm text-gray-500", children: "Please contact your system administrator for access." })] }) }));
    }
    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
        if (onUnauthorized) {
            onUnauthorized();
            return null;
        }
        return fallback || (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 mb-4", children: "You don't have permission to access this page." }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Required role: ", requiredRole] })] }) }));
    }
    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
        if (onUnauthorized) {
            onUnauthorized();
            return null;
        }
        return fallback || (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 mb-4", children: "You don't have permission to perform this action." }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Required permission: ", requiredPermission] })] }) }));
    }
    // All checks passed, render children
    return _jsx(_Fragment, { children: children });
}
