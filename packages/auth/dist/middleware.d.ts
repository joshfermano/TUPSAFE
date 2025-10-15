import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export declare function createAuthMiddleware(): Promise<(req: NextRequest) => Promise<NextResponse<unknown>>>;
export declare function getUserFromHeaders(headers: Headers): {
    id: string;
    role: any;
} | null;
