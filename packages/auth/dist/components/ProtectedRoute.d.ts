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
<<<<<<< HEAD
export declare function ProtectedRoute({ children, requireAuth, requiredRole, requiredPermission, fallback, onUnauthorized, }: ProtectedRouteProps): string | number | bigint | true | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | import("react/jsx-runtime").JSX.Element | null;
=======
export declare function ProtectedRoute({ children, requireAuth, requiredRole, requiredPermission, fallback, onUnauthorized, }: ProtectedRouteProps): string | number | bigint | true | import("react/jsx-runtime").JSX.Element | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null;
>>>>>>> 6c5a2a90b895fe799737953af84eabfa72051d69
export {};
