import { v7 as uuidv7 } from 'uuid';
// Mock users for authentication
export const mockAuthUsers = [
    {
        id: '01927d4e-8b45-7f52-b123-456789abcdef',
        email: 'juan.delcruz@dost.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-15T08:30:00Z'),
        createdAt: new Date('2024-06-01T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde0',
        email: 'maria.santos@deped.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-14T16:45:00Z'),
        createdAt: new Date('2024-05-15T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde1',
        email: 'jose.rizal@doh.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-13T09:15:00Z'),
        createdAt: new Date('2024-07-10T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde2',
        email: 'ana.luna@dof.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-12T14:20:00Z'),
        createdAt: new Date('2024-08-20T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde3',
        email: 'rodrigo.duterte@op.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-11T10:00:00Z'),
        createdAt: new Date('2024-04-01T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde4',
        email: 'grace.poe@senate.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-10T11:30:00Z'),
        createdAt: new Date('2024-03-15T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde5',
        email: 'manny.villar@dpwh.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-09T15:45:00Z'),
        createdAt: new Date('2024-09-05T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde6',
        email: 'leni.robredo@ovp.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-08T13:20:00Z'),
        createdAt: new Date('2024-02-28T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde7',
        email: 'panfilo.lacson@pnp.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-07T12:10:00Z'),
        createdAt: new Date('2024-01-20T00:00:00Z'),
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde8',
        email: 'francis.pangilinan@da.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-06T09:30:00Z'),
        createdAt: new Date('2024-10-12T00:00:00Z'),
    },
];
// Mock session storage
export const mockSessions = [];
// Mock authentication functions
export class MockAuth {
    static async signIn(email, password) {
        const user = mockAuthUsers.find((u) => u.email === email && u.password === password);
        if (!user) {
            return null;
        }
        const session = {
            userId: user.id,
            token: uuidv7(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdAt: new Date(),
        };
        // Update last sign in
        user.lastSignIn = new Date();
        this.currentUser = user;
        this.currentSession = session;
        mockSessions.push(session);
        return { user, session };
    }
    static async signOut() {
        if (this.currentSession) {
            const sessionIndex = mockSessions.findIndex((s) => s.token === this.currentSession.token);
            if (sessionIndex >= 0) {
                mockSessions.splice(sessionIndex, 1);
            }
        }
        this.currentUser = null;
        this.currentSession = null;
    }
    static getCurrentUser() {
        return this.currentUser;
    }
    static getCurrentSession() {
        return this.currentSession;
    }
    static async getUser(id) {
        return mockAuthUsers.find((u) => u.id === id) || null;
    }
    static async validateSession(token) {
        const session = mockSessions.find((s) => s.token === token && s.expiresAt > new Date());
        if (!session) {
            return null;
        }
        return this.getUser(session.userId);
    }
    static async createUser(email, password) {
        const user = {
            id: uuidv7(),
            email,
            password,
            emailConfirmed: false,
            lastSignIn: null,
            createdAt: new Date(),
        };
        mockAuthUsers.push(user);
        return user;
    }
    static async updateUser(id, updates) {
        const userIndex = mockAuthUsers.findIndex((u) => u.id === id);
        if (userIndex === -1) {
            return null;
        }
        Object.assign(mockAuthUsers[userIndex], updates);
        return mockAuthUsers[userIndex];
    }
    static async deleteUser(id) {
        const userIndex = mockAuthUsers.findIndex((u) => u.id === id);
        if (userIndex === -1) {
            return false;
        }
        mockAuthUsers.splice(userIndex, 1);
        // Remove related sessions
        const sessionIndicesToRemove = mockSessions
            .map((session, index) => (session.userId === id ? index : -1))
            .filter((index) => index !== -1)
            .reverse();
        sessionIndicesToRemove.forEach((index) => mockSessions.splice(index, 1));
        return true;
    }
    static async resetPassword(email, newPassword) {
        const user = mockAuthUsers.find((u) => u.email === email);
        if (!user) {
            return false;
        }
        user.password = newPassword;
        return true;
    }
    static async confirmEmail(id) {
        const user = mockAuthUsers.find((u) => u.id === id);
        if (!user) {
            return false;
        }
        user.emailConfirmed = true;
        return true;
    }
}
MockAuth.currentUser = null;
MockAuth.currentSession = null;
// Export for testing and development
export { MockAuth as default };
