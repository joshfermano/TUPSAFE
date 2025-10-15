interface LoginFormProps {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    redirectTo?: string;
}
export declare function LoginForm({ onSuccess, onError, redirectTo }: LoginFormProps): import("react/jsx-runtime").JSX.Element;
export {};
