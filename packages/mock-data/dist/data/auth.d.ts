export interface MockUser {
    id: string;
    email: string;
    password: string;
    emailConfirmed: boolean;
    lastSignIn: Date | null;
    createdAt: Date;
}
export interface MockSession {
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export declare const mockAuthUsers: MockUser[];
export declare const mockSessions: MockSession[];
export declare class MockAuth {
    private static currentUser;
    private static currentSession;
    static signIn(email: string, password: string): Promise<{
        user: MockUser;
        session: MockSession;
    } | null>;
    static signOut(): Promise<void>;
    static getCurrentUser(): MockUser | null;
    static getCurrentSession(): MockSession | null;
    static getUser(id: string): Promise<MockUser | null>;
    static validateSession(token: string): Promise<MockUser | null>;
    static createUser(email: string, password: string): Promise<MockUser>;
    static updateUser(id: string, updates: Partial<Omit<MockUser, 'id' | 'createdAt'>>): Promise<MockUser | null>;
    static deleteUser(id: string): Promise<boolean>;
    static resetPassword(email: string, newPassword: string): Promise<boolean>;
    static confirmEmail(id: string): Promise<boolean>;
}
export { MockAuth as default };
