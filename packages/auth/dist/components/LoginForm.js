'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
export function LoginForm({ onSuccess, onError, redirectTo }) {
    const [formData, setFormData] = useState({
        loginIdentifier: '',
        password: '',
        rememberMe: false,
        mfaCode: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [needsMfa, setNeedsMfa] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});
    const validateForm = () => {
        const newErrors = {};
        if (!formData.loginIdentifier.trim()) {
            newErrors.loginIdentifier = 'Please enter your employee ID or email';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        }
        else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (needsMfa && formData.mfaCode && !/^\d{6}$/.test(formData.mfaCode)) {
            newErrors.mfaCode = 'MFA code must be 6 digits';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Simulate authentication (replace with actual auth logic)
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Simulate successful login
            onSuccess?.();
        }
        catch (err) {
            const errorMessage = err?.message || 'An unexpected error occurred';
            setError(errorMessage);
            onError?.(err);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "loginIdentifier", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Employee ID or Email" }), _jsx("input", { type: "text", id: "loginIdentifier", value: formData.loginIdentifier, onChange: (e) => handleInputChange('loginIdentifier', e.target.value), className: "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-400 dark:focus:border-blue-400", placeholder: "Enter your employee ID or government email", disabled: isLoading }), errors.loginIdentifier && (_jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: errors.loginIdentifier }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "password", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? 'text' : 'password', id: "password", value: formData.password, onChange: (e) => handleInputChange('password', e.target.value), className: "w-full px-3 py-2 pr-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-400 dark:focus:border-blue-400", placeholder: "Enter your password", disabled: isLoading }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300", onClick: () => setShowPassword(!showPassword), disabled: isLoading, children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] }), errors.password && (_jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: errors.password }))] }), needsMfa && (_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { htmlFor: "mfaCode", className: "text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center", children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "Two-Factor Authentication Code"] }), _jsx("input", { type: "text", id: "mfaCode", value: formData.mfaCode, onChange: (e) => handleInputChange('mfaCode', e.target.value), maxLength: 6, className: "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-center text-lg tracking-wider", placeholder: "000000", disabled: isLoading }), errors.mfaCode && (_jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: errors.mfaCode })), _jsx("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: "Enter the 6-digit code from your authenticator app" })] })), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "rememberMe", checked: formData.rememberMe, onChange: (e) => handleInputChange('rememberMe', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded dark:border-slate-600 dark:bg-slate-800", disabled: isLoading }), _jsx("label", { htmlFor: "rememberMe", className: "ml-2 block text-sm text-slate-700 dark:text-slate-300", children: "Remember me for 30 days" })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), needsMfa ? 'Verifying...' : 'Signing in...'] })) : needsMfa ? ('Verify Code') : ('Sign In') }), !needsMfa && (_jsx("div", { className: "text-center text-sm text-slate-600 dark:text-slate-400", children: _jsxs("p", { children: ["Forgot your password?", ' ', _jsx("button", { type: "button", className: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium", onClick: () => {
                                // Handle password reset
                                console.log('Password reset requested');
                            }, children: "Reset it here" })] }) }))] }));
}
