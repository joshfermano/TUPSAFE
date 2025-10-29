import React from 'react';
import type { Role } from '@tupsafe/database';
interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requiredRole?: Role;
    requiredPermission?: string;
    fallback?: React.ReactNode;
    onUnauthorized?: () => void;
}
export declare function ProtectedRoute({ children, requireAuth, requiredRole, requiredPermission, fallback, onUnauthorized, }: ProtectedRouteProps): string | number | bigint | true | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | import("react/jsx-runtime").JSX.Element | null;
export {};
