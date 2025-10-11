import React from 'react';
import type { Role } from '@smartgov/database';
interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requiredRole?: Role;
    requiredPermission?: string;
    fallback?: React.ReactNode;
    onUnauthorized?: () => void;
}
export declare function ProtectedRoute({ children, requireAuth, requiredRole, requiredPermission, fallback, onUnauthorized, }: ProtectedRouteProps): string | number | bigint | true | import("react/jsx-runtime").JSX.Element | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null;
export {};
