export {
  RealAuthProvider as AuthProvider,
  useRealAuth as useAuth,
  AuthContext,
  type User,
  type AdminProfile,
  type OTPVerificationState,
} from './RealAuthContext';

// Default export for convenience
export { AuthContext as default } from './RealAuthContext';
