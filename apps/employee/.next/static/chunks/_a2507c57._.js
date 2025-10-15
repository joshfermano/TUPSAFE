(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/employee/src/context/ThemeContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeContext",
    ()=>ThemeContext,
    "ThemeProvider",
    ()=>ThemeProvider,
    "ThemeScript",
    ()=>ThemeScript,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
// Create the theme context
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Storage key constant
const STORAGE_KEY = 'smartgov-theme';
// Helper function to get system theme
const getSystemTheme = ()=>{
    if ("TURBOPACK compile-time truthy", 1) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    //TURBOPACK unreachable
    ;
};
// Helper function to resolve theme
const resolveTheme = (theme, systemTheme)=>{
    return theme === 'system' ? systemTheme : theme;
};
// Helper function to apply theme to DOM
const applyTheme = function(resolvedTheme) {
    let disableTransitionOnChange = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    const root = document.documentElement;
    // Disable transitions temporarily if specified
    if (disableTransitionOnChange) {
        const css = document.createElement('style');
        css.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"));
        document.head.appendChild(css);
        // Force reflow
        (()=>window.getComputedStyle(document.body))();
        // Re-enable transitions after a short delay
        setTimeout(()=>{
            document.head.removeChild(css);
        }, 1);
    }
    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    // Set data attribute for additional styling hooks
    root.setAttribute('data-theme', resolvedTheme);
    // Set color scheme for native elements
    root.style.colorScheme = resolvedTheme;
};
const ThemeProvider = (param)=>{
    let { children, defaultTheme = 'system', enableSystem = true, disableTransitionOnChange = false, storageKey = STORAGE_KEY } = param;
    _s();
    const [theme, setThemeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(defaultTheme);
    const [systemTheme, setSystemTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('light');
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Initialize theme from storage
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            const storedTheme = localStorage.getItem(storageKey);
            const initialSystemTheme = getSystemTheme();
            setSystemTheme(initialSystemTheme);
            if (storedTheme && [
                'light',
                'dark',
                'system'
            ].includes(storedTheme)) {
                setThemeState(storedTheme);
            } else {
                setThemeState(defaultTheme);
            }
            setMounted(true);
        }
    }["ThemeProvider.useEffect"], [
        defaultTheme,
        storageKey
    ]);
    // Listen for system theme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (!enableSystem) return;
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleSystemThemeChange = {
                "ThemeProvider.useEffect.handleSystemThemeChange": (e)=>{
                    const newSystemTheme = e.matches ? 'dark' : 'light';
                    setSystemTheme(newSystemTheme);
                }
            }["ThemeProvider.useEffect.handleSystemThemeChange"];
            mediaQuery.addEventListener('change', handleSystemThemeChange);
            return ({
                "ThemeProvider.useEffect": ()=>{
                    mediaQuery.removeEventListener('change', handleSystemThemeChange);
                }
            })["ThemeProvider.useEffect"];
        }
    }["ThemeProvider.useEffect"], [
        enableSystem
    ]);
    // Apply theme to DOM when theme or systemTheme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (!mounted) return;
            const resolvedTheme = resolveTheme(theme, systemTheme);
            applyTheme(resolvedTheme, disableTransitionOnChange);
        }
    }["ThemeProvider.useEffect"], [
        theme,
        systemTheme,
        mounted,
        disableTransitionOnChange
    ]);
    // Set theme function
    const setTheme = (newTheme)=>{
        setThemeState(newTheme);
        localStorage.setItem(storageKey, newTheme);
    };
    // Toggle theme function
    const toggleTheme = ()=>{
        const currentResolvedTheme = resolveTheme(theme, systemTheme);
        const newTheme = currentResolvedTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };
    // Resolve current theme
    const resolvedTheme = resolveTheme(theme, systemTheme);
    const value = {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        systemTheme
    };
    // Always provide context, but with loading state when not mounted
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/context/ThemeContext.tsx",
        lineNumber: 174,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ThemeProvider, "6KUI2dCt1PEu4q8fh+m8fLFn2Eo=");
_c = ThemeProvider;
const useTheme = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
_s1(useTheme, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const ThemeScript = ()=>{
    const script = "\n    (function() {\n      try {\n        const storageKey = '".concat(STORAGE_KEY, "';\n        const theme = localStorage.getItem(storageKey) || 'system';\n        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';\n        const resolvedTheme = theme === 'system' ? systemTheme : theme;\n        \n        document.documentElement.classList.add(resolvedTheme);\n        document.documentElement.setAttribute('data-theme', resolvedTheme);\n        document.documentElement.style.colorScheme = resolvedTheme;\n      } catch (e) {\n        console.error('Theme initialization error:', e);\n      }\n    })();\n  ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        dangerouslySetInnerHTML: {
            __html: script
        }
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/context/ThemeContext.tsx",
        lineNumber: 208,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_c1 = ThemeScript;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "ThemeProvider");
__turbopack_context__.k.register(_c1, "ThemeScript");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/theme/ThemeToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeToggle",
    ()=>ThemeToggle,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/monitor.js [app-client] (ecmascript) <export default as Monitor>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$context$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/context/ThemeContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const ThemeToggle = (param)=>{
    let { variant = 'button', size = 'md', showLabel = false, className = '' } = param;
    _s();
    const { theme, setTheme, resolvedTheme, toggleTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$context$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    const sizeClasses = {
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg'
    };
    const iconSize = {
        sm: 16,
        md: 20,
        lg: 24
    };
    if (variant === 'minimal') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: toggleTheme,
            className: "\n          ".concat(sizeClasses[size], "\n          rounded-md border border-border bg-background\n          hover:bg-accent hover:text-accent-foreground\n          focus-government\n          transition-all duration-200 ease-in-out\n          flex items-center justify-center\n          ").concat(className, "\n        "),
            "aria-label": "Switch to ".concat(resolvedTheme === 'light' ? 'dark' : 'light', " theme"),
            children: resolvedTheme === 'light' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                size: iconSize[size]
            }, void 0, false, {
                fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                lineNumber: 51,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                size: iconSize[size]
            }, void 0, false, {
                fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                lineNumber: 53,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    if (variant === 'dropdown') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative inline-block text-left ".concat(className),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: theme,
                    onChange: (e)=>setTheme(e.target.value),
                    className: "\n            ".concat(sizeClasses[size], "\n            pl-10 pr-8 py-2\n            bg-background border border-border rounded-md\n            text-foreground\n            focus-government\n            hover:bg-accent\n            transition-all duration-200 ease-in-out\n            appearance-none cursor-pointer\n          "),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "light",
                            children: "Light"
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "dark",
                            children: "Dark"
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 78,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "system",
                            children: "System"
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
                    children: [
                        theme === 'light' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                            size: iconSize[size],
                            className: "text-muted-foreground"
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 83,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        theme === 'dark' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                            size: iconSize[size],
                            className: "text-muted-foreground"
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 86,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        theme === 'system' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__["Monitor"], {
                            size: iconSize[size],
                            className: "text-muted-foreground"
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 89,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
            lineNumber: 61,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Default button variant
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2 ".concat(className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center rounded-md border border-border bg-background p-1",
            children: [
                'light',
                'dark',
                'system'
            ].map((themeName)=>{
                const isActive = theme === themeName;
                const Icon = themeName === 'light' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"] : themeName === 'dark' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__["Monitor"];
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setTheme(themeName),
                    className: "\n                ".concat(sizeClasses[size], "\n                rounded-sm px-2\n                transition-all duration-200 ease-in-out\n                focus-government\n                flex items-center justify-center gap-2\n                ").concat(isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent', "\n              "),
                    "aria-label": "Switch to ".concat(themeName, " theme"),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            size: iconSize[size]
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 122,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "capitalize text-xs font-medium",
                            children: themeName
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                            lineNumber: 124,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, themeName, true, {
                    fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
                    lineNumber: 106,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0));
            })
        }, void 0, false, {
            fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
            lineNumber: 99,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/theme/ThemeToggle.tsx",
        lineNumber: 98,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ThemeToggle, "UgqNZ4/hg90+WwoVW1d78oyiK9A=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$context$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = ThemeToggle;
const __TURBOPACK__default__export__ = ThemeToggle;
var _c;
__turbopack_context__.k.register(_c, "ThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/data/auth.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MockAuth",
    ()=>MockAuth,
    "default",
    ()=>MockAuth,
    "mockAuthUsers",
    ()=>mockAuthUsers,
    "mockSessions",
    ()=>mockSessions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/node_modules/uuid/dist/esm-browser/v7.js [app-client] (ecmascript) <export default as v7>");
;
const mockAuthUsers = [
    {
        id: '01927d4e-8b45-7f52-b123-456789abcdef',
        email: 'juan.delcruz@dost.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-15T08:30:00Z'),
        createdAt: new Date('2024-06-01T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde0',
        email: 'maria.santos@deped.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-14T16:45:00Z'),
        createdAt: new Date('2024-05-15T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde1',
        email: 'jose.rizal@doh.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-13T09:15:00Z'),
        createdAt: new Date('2024-07-10T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde2',
        email: 'ana.luna@dof.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-12T14:20:00Z'),
        createdAt: new Date('2024-08-20T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde3',
        email: 'rodrigo.duterte@op.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-11T10:00:00Z'),
        createdAt: new Date('2024-04-01T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde4',
        email: 'grace.poe@senate.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-10T11:30:00Z'),
        createdAt: new Date('2024-03-15T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde5',
        email: 'manny.villar@dpwh.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-09T15:45:00Z'),
        createdAt: new Date('2024-09-05T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde6',
        email: 'leni.robredo@ovp.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-08T13:20:00Z'),
        createdAt: new Date('2024-02-28T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde7',
        email: 'panfilo.lacson@pnp.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-07T12:10:00Z'),
        createdAt: new Date('2024-01-20T00:00:00Z')
    },
    {
        id: '01927d4e-8b45-7f52-b123-456789abcde8',
        email: 'francis.pangilinan@da.gov.ph',
        password: 'password123',
        emailConfirmed: true,
        lastSignIn: new Date('2025-01-06T09:30:00Z'),
        createdAt: new Date('2024-10-12T00:00:00Z')
    }
];
const mockSessions = [];
class MockAuth {
    static async signIn(email, password) {
        const user = mockAuthUsers.find((u)=>u.email === email && u.password === password);
        if (!user) {
            return null;
        }
        const session = {
            userId: user.id,
            token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            createdAt: new Date()
        };
        // Update last sign in
        user.lastSignIn = new Date();
        this.currentUser = user;
        this.currentSession = session;
        mockSessions.push(session);
        return {
            user,
            session
        };
    }
    static async signOut() {
        if (this.currentSession) {
            const sessionIndex = mockSessions.findIndex((s)=>s.token === this.currentSession.token);
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
        return mockAuthUsers.find((u)=>u.id === id) || null;
    }
    static async validateSession(token) {
        const session = mockSessions.find((s)=>s.token === token && s.expiresAt > new Date());
        if (!session) {
            return null;
        }
        return this.getUser(session.userId);
    }
    static async createUser(email, password) {
        const user = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
            email,
            password,
            emailConfirmed: false,
            lastSignIn: null,
            createdAt: new Date()
        };
        mockAuthUsers.push(user);
        return user;
    }
    static async updateUser(id, updates) {
        const userIndex = mockAuthUsers.findIndex((u)=>u.id === id);
        if (userIndex === -1) {
            return null;
        }
        Object.assign(mockAuthUsers[userIndex], updates);
        return mockAuthUsers[userIndex];
    }
    static async deleteUser(id) {
        const userIndex = mockAuthUsers.findIndex((u)=>u.id === id);
        if (userIndex === -1) {
            return false;
        }
        mockAuthUsers.splice(userIndex, 1);
        // Remove related sessions
        const sessionIndicesToRemove = mockSessions.map((session, index)=>session.userId === id ? index : -1).filter((index)=>index !== -1).reverse();
        sessionIndicesToRemove.forEach((index)=>mockSessions.splice(index, 1));
        return true;
    }
    static async resetPassword(email, newPassword) {
        const user = mockAuthUsers.find((u)=>u.email === email);
        if (!user) {
            return false;
        }
        user.password = newPassword;
        return true;
    }
    static async confirmEmail(id) {
        const user = mockAuthUsers.find((u)=>u.id === id);
        if (!user) {
            return false;
        }
        user.emailConfirmed = true;
        return true;
    }
}
MockAuth.currentUser = null;
MockAuth.currentSession = null;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/utils/storage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * LocalStorage utility for persisting mock data
 * Simulates backend database persistence during development
 */ __turbopack_context__.s([
    "storage",
    ()=>storage
]);
const STORAGE_PREFIX = 'smartgov_mock_';
const storage = {
    /**
     * Get item from localStorage
     */ get: (key)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const item = localStorage.getItem("".concat(STORAGE_PREFIX).concat(key));
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error("Error reading from localStorage: ".concat(key), error);
            return null;
        }
    },
    /**
     * Set item in localStorage
     */ set: (key, value)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            localStorage.setItem("".concat(STORAGE_PREFIX).concat(key), JSON.stringify(value));
        } catch (error) {
            console.error("Error writing to localStorage: ".concat(key), error);
        }
    },
    /**
     * Remove item from localStorage
     */ remove: (key)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            localStorage.removeItem("".concat(STORAGE_PREFIX).concat(key));
        } catch (error) {
            console.error("Error removing from localStorage: ".concat(key), error);
        }
    },
    /**
     * Clear all SmartGov mock data from localStorage
     */ clear: ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            Object.keys(localStorage).filter((key)=>key.startsWith(STORAGE_PREFIX)).forEach((key)=>localStorage.removeItem(key));
        } catch (error) {
            console.error('Error clearing localStorage', error);
        }
    },
    /**
     * Get all keys with the SmartGov prefix
     */ keys: ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return Object.keys(localStorage).filter((key)=>key.startsWith(STORAGE_PREFIX)).map((key)=>key.replace(STORAGE_PREFIX, ''));
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/hooks/useAuth.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/auth.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/utils/storage.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const CURRENT_USER_KEY = 'current_user';
const CURRENT_SESSION_KEY = 'current_session';
function useAuth() {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Initialize auth state from localStorage
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuth.useEffect": ()=>{
            const storedUser = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].get(CURRENT_USER_KEY);
            const storedSession = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].get(CURRENT_SESSION_KEY);
            if (storedUser && storedSession) {
                // Check if session is still valid
                if (new Date(storedSession.expiresAt) > new Date()) {
                    setUser(storedUser);
                    setSession(storedSession);
                } else {
                    // Session expired, clear storage
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].remove(CURRENT_USER_KEY);
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].remove(CURRENT_SESSION_KEY);
                }
            }
            setLoading(false);
        }
    }["useAuth.useEffect"], []);
    const signIn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[signIn]": async (email, password)=>{
            setLoading(true);
            setError(null);
            try {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MockAuth"].signIn(email, password);
                if ((result === null || result === void 0 ? void 0 : result.session) && (result === null || result === void 0 ? void 0 : result.user)) {
                    setUser(result.user);
                    setSession(result.session);
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(CURRENT_USER_KEY, result.user);
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(CURRENT_SESSION_KEY, result.session);
                    return true;
                } else {
                    setError('Invalid email or password');
                    return false;
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                return false;
            } finally{
                setLoading(false);
            }
        }
    }["useAuth.useCallback[signIn]"], []);
    const signOut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[signOut]": async ()=>{
            setLoading(true);
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MockAuth"].signOut();
                setUser(null);
                setSession(null);
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].remove(CURRENT_USER_KEY);
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].remove(CURRENT_SESSION_KEY);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Sign out failed');
            } finally{
                setLoading(false);
            }
        }
    }["useAuth.useCallback[signOut]"], []);
    const signUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[signUp]": async (email, password)=>{
            setLoading(true);
            setError(null);
            try {
                // Mock sign up - just call sign in for now
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MockAuth"].signIn(email, password);
                if ((result === null || result === void 0 ? void 0 : result.session) && (result === null || result === void 0 ? void 0 : result.user)) {
                    setUser(result.user);
                    setSession(result.session);
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(CURRENT_USER_KEY, result.user);
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(CURRENT_SESSION_KEY, result.session);
                    return true;
                } else {
                    setError('Sign up failed');
                    return false;
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                return false;
            } finally{
                setLoading(false);
            }
        }
    }["useAuth.useCallback[signUp]"], []);
    return {
        user,
        session,
        loading,
        error,
        signIn,
        signOut,
        signUp
    };
}
_s(useAuth, "e9jptwmnfqzBeuevJIhQFD56p48=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/data/users.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateMockDepartment",
    ()=>generateMockDepartment,
    "generateMockPosition",
    ()=>generateMockPosition,
    "generateMockProfile",
    ()=>generateMockProfile,
    "getDepartmentById",
    ()=>getDepartmentById,
    "getDepartmentsByParent",
    ()=>getDepartmentsByParent,
    "getPositionById",
    ()=>getPositionById,
    "getPositionsByDepartment",
    ()=>getPositionsByDepartment,
    "getProfileById",
    ()=>getProfileById,
    "getProfilesByDepartment",
    ()=>getProfilesByDepartment,
    "getProfilesByRole",
    ()=>getProfilesByRole,
    "mockDataSummary",
    ()=>mockDataSummary,
    "mockDepartments",
    ()=>mockDepartments,
    "mockPositions",
    ()=>mockPositions,
    "mockProfiles",
    ()=>mockProfiles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/node_modules/uuid/dist/esm-browser/v7.js [app-client] (ecmascript) <export default as v7>");
;
const mockDepartments = [
    {
        id: "01927d4e-8b45-7000-0001-000000000001",
        name: "Department of Science and Technology",
        code: "DOST",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000002",
        name: "Department of Education",
        code: "DEPED",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000003",
        name: "Department of Health",
        code: "DOH",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000004",
        name: "Department of Finance",
        code: "DOF",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000005",
        name: "Office of the President",
        code: "OP",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000006",
        name: "Senate of the Philippines",
        code: "SENATE",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000007",
        name: "Department of Public Works and Highways",
        code: "DPWH",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000008",
        name: "Office of the Vice President",
        code: "OVP",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000009",
        name: "Philippine National Police",
        code: "PNP",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000010",
        name: "Department of Agriculture",
        code: "DA",
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // Sub-departments/bureaus
    {
        id: "01927d4e-8b45-7000-0001-000000000011",
        name: "Science Education Institute",
        code: "SEI",
        parentId: "01927d4e-8b45-7000-0001-000000000001",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000012",
        name: "Philippine Council for Health Research and Development",
        code: "PCHRD",
        parentId: "01927d4e-8b45-7000-0001-000000000001",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000013",
        name: "Bureau of Internal Revenue",
        code: "BIR",
        parentId: "01927d4e-8b45-7000-0001-000000000004",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000014",
        name: "Bureau of Customs",
        code: "BOC",
        parentId: "01927d4e-8b45-7000-0001-000000000004",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7000-0001-000000000015",
        name: "Food and Drug Administration",
        code: "FDA",
        parentId: "01927d4e-8b45-7000-0001-000000000003",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    }
];
const mockPositions = [
    // DOST positions
    {
        id: "01927d4e-8b45-7100-0001-000000000001",
        title: "Science Research Specialist II",
        gradeLevel: 22,
        departmentId: "01927d4e-8b45-7000-0001-000000000001",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000002",
        title: "Research Director",
        gradeLevel: 27,
        departmentId: "01927d4e-8b45-7000-0001-000000000001",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // DEPED positions
    {
        id: "01927d4e-8b45-7100-0001-000000000003",
        title: "Teacher III",
        gradeLevel: 18,
        departmentId: "01927d4e-8b45-7000-0001-000000000002",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000004",
        title: "Schools Division Superintendent",
        gradeLevel: 30,
        departmentId: "01927d4e-8b45-7000-0001-000000000002",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // DOH positions
    {
        id: "01927d4e-8b45-7100-0001-000000000005",
        title: "Medical Officer IV",
        gradeLevel: 24,
        departmentId: "01927d4e-8b45-7000-0001-000000000003",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000006",
        title: "Chief of Hospital",
        gradeLevel: 28,
        departmentId: "01927d4e-8b45-7000-0001-000000000003",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // DOF positions
    {
        id: "01927d4e-8b45-7100-0001-000000000007",
        title: "Revenue Officer V",
        gradeLevel: 24,
        departmentId: "01927d4e-8b45-7000-0001-000000000004",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000008",
        title: "Assistant Secretary",
        gradeLevel: 30,
        departmentId: "01927d4e-8b45-7000-0001-000000000004",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // OP positions
    {
        id: "01927d4e-8b45-7100-0001-000000000009",
        title: "Presidential Assistant",
        gradeLevel: 29,
        departmentId: "01927d4e-8b45-7000-0001-000000000005",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000010",
        title: "Executive Secretary",
        gradeLevel: 31,
        departmentId: "01927d4e-8b45-7000-0001-000000000005",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // Senate positions
    {
        id: "01927d4e-8b45-7100-0001-000000000011",
        title: "Legislative Staff Officer V",
        gradeLevel: 24,
        departmentId: "01927d4e-8b45-7000-0001-000000000006",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000012",
        title: "Secretary General",
        gradeLevel: 32,
        departmentId: "01927d4e-8b45-7000-0001-000000000006",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // DPWH positions
    {
        id: "01927d4e-8b45-7100-0001-000000000013",
        title: "Engineer III",
        gradeLevel: 22,
        departmentId: "01927d4e-8b45-7000-0001-000000000007",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000014",
        title: "District Engineer",
        gradeLevel: 26,
        departmentId: "01927d4e-8b45-7000-0001-000000000007",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // OVP positions
    {
        id: "01927d4e-8b45-7100-0001-000000000015",
        title: "Administrative Officer V",
        gradeLevel: 24,
        departmentId: "01927d4e-8b45-7000-0001-000000000008",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000016",
        title: "Chief of Staff",
        gradeLevel: 30,
        departmentId: "01927d4e-8b45-7000-0001-000000000008",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // PNP positions
    {
        id: "01927d4e-8b45-7100-0001-000000000017",
        title: "Police Officer III",
        gradeLevel: 18,
        departmentId: "01927d4e-8b45-7000-0001-000000000009",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000018",
        title: "Police Colonel",
        gradeLevel: 26,
        departmentId: "01927d4e-8b45-7000-0001-000000000009",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    // DA positions
    {
        id: "01927d4e-8b45-7100-0001-000000000019",
        title: "Agriculturist II",
        gradeLevel: 18,
        departmentId: "01927d4e-8b45-7000-0001-000000000010",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7100-0001-000000000020",
        title: "Regional Technical Director",
        gradeLevel: 27,
        departmentId: "01927d4e-8b45-7000-0001-000000000010",
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z')
    }
];
const mockProfiles = [
    {
        id: "01927d4e-8b45-7f52-b123-456789abcdef",
        employeeId: "DOST-2023-001",
        firstName: "Juan",
        lastName: "dela Cruz",
        middleName: "Mercado",
        role: "employee",
        departmentId: "01927d4e-8b45-7000-0001-000000000001",
        positionId: "01927d4e-8b45-7100-0001-000000000001",
        isActive: true,
        createdAt: new Date('2024-06-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde0",
        employeeId: "DEPED-2023-047",
        firstName: "Maria",
        lastName: "Santos",
        middleName: "Gonzales",
        role: "hr",
        departmentId: "01927d4e-8b45-7000-0001-000000000002",
        positionId: "01927d4e-8b45-7100-0001-000000000004",
        isActive: true,
        createdAt: new Date('2024-05-15T00:00:00Z'),
        updatedAt: new Date('2024-05-15T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde1",
        employeeId: "DOH-2024-089",
        firstName: "Jose",
        lastName: "Rizal",
        middleName: "Protacio",
        role: "supervisor",
        departmentId: "01927d4e-8b45-7000-0001-000000000003",
        positionId: "01927d4e-8b45-7100-0001-000000000006",
        isActive: true,
        createdAt: new Date('2024-07-10T00:00:00Z'),
        updatedAt: new Date('2024-07-10T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde2",
        employeeId: "DOF-2024-125",
        firstName: "Ana",
        lastName: "Luna",
        middleName: "Bautista",
        role: "auditor",
        departmentId: "01927d4e-8b45-7000-0001-000000000004",
        positionId: "01927d4e-8b45-7100-0001-000000000008",
        isActive: true,
        createdAt: new Date('2024-08-20T00:00:00Z'),
        updatedAt: new Date('2024-08-20T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde3",
        employeeId: "OP-2024-001",
        firstName: "Rodrigo",
        lastName: "Duterte",
        middleName: "Roa",
        role: "admin",
        departmentId: "01927d4e-8b45-7000-0001-000000000005",
        positionId: "01927d4e-8b45-7100-0001-000000000010",
        isActive: true,
        createdAt: new Date('2024-04-01T00:00:00Z'),
        updatedAt: new Date('2024-04-01T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde4",
        employeeId: "SENATE-2024-033",
        firstName: "Grace",
        lastName: "Poe",
        middleName: "Llamanzares",
        role: "employee",
        departmentId: "01927d4e-8b45-7000-0001-000000000006",
        positionId: "01927d4e-8b45-7100-0001-000000000011",
        isActive: true,
        createdAt: new Date('2024-03-15T00:00:00Z'),
        updatedAt: new Date('2024-03-15T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde5",
        employeeId: "DPWH-2024-078",
        firstName: "Manuel",
        lastName: "Villar",
        middleName: "Bamba",
        role: "supervisor",
        departmentId: "01927d4e-8b45-7000-0001-000000000007",
        positionId: "01927d4e-8b45-7100-0001-000000000014",
        isActive: true,
        createdAt: new Date('2024-09-05T00:00:00Z'),
        updatedAt: new Date('2024-09-05T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde6",
        employeeId: "OVP-2024-012",
        firstName: "Leni",
        lastName: "Robredo",
        middleName: "Gerona",
        role: "hr",
        departmentId: "01927d4e-8b45-7000-0001-000000000008",
        positionId: "01927d4e-8b45-7100-0001-000000000016",
        isActive: true,
        createdAt: new Date('2024-02-28T00:00:00Z'),
        updatedAt: new Date('2024-02-28T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde7",
        employeeId: "PNP-2024-156",
        firstName: "Panfilo",
        lastName: "Lacson",
        middleName: "Morena",
        role: "employee",
        departmentId: "01927d4e-8b45-7000-0001-000000000009",
        positionId: "01927d4e-8b45-7100-0001-000000000018",
        isActive: true,
        createdAt: new Date('2024-01-20T00:00:00Z'),
        updatedAt: new Date('2024-01-20T00:00:00Z')
    },
    {
        id: "01927d4e-8b45-7f52-b123-456789abcde8",
        employeeId: "DA-2024-203",
        firstName: "Francis",
        lastName: "Pangilinan",
        middleName: "Nepomuceno",
        role: "employee",
        departmentId: "01927d4e-8b45-7000-0001-000000000010",
        positionId: "01927d4e-8b45-7100-0001-000000000020",
        isActive: true,
        createdAt: new Date('2024-10-12T00:00:00Z'),
        updatedAt: new Date('2024-10-12T00:00:00Z')
    }
];
function getDepartmentById(id) {
    return mockDepartments.find((dept)=>dept.id === id);
}
function getPositionById(id) {
    return mockPositions.find((pos)=>pos.id === id);
}
function getProfileById(id) {
    return mockProfiles.find((profile)=>profile.id === id);
}
function getProfilesByDepartment(departmentId) {
    return mockProfiles.filter((profile)=>profile.departmentId === departmentId);
}
function getProfilesByRole(role) {
    return mockProfiles.filter((profile)=>profile.role === role);
}
function getDepartmentsByParent(parentId) {
    return mockDepartments.filter((dept)=>dept.parentId === parentId);
}
function getPositionsByDepartment(departmentId) {
    return mockPositions.filter((pos)=>pos.departmentId === departmentId);
}
function generateMockProfile(firstName, lastName, middleName, role, departmentId, positionId) {
    var _getDepartmentById;
    const employeeIdPrefix = ((_getDepartmentById = getDepartmentById(departmentId)) === null || _getDepartmentById === void 0 ? void 0 : _getDepartmentById.code) || 'GOV';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
        employeeId: "".concat(employeeIdPrefix, "-").concat(year, "-").concat(randomNum),
        firstName,
        lastName,
        middleName,
        role,
        departmentId,
        positionId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
function generateMockDepartment(name, code) {
    let parentId = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
        name,
        code,
        parentId,
        isActive: true,
        createdAt: new Date()
    };
}
function generateMockPosition(title, gradeLevel, departmentId) {
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
        title,
        gradeLevel,
        departmentId,
        isActive: true,
        createdAt: new Date()
    };
}
const mockDataSummary = {
    departments: mockDepartments.length,
    positions: mockPositions.length,
    profiles: mockProfiles.length,
    roles: {
        employee: mockProfiles.filter((p)=>p.role === 'employee').length,
        hr: mockProfiles.filter((p)=>p.role === 'hr').length,
        admin: mockProfiles.filter((p)=>p.role === 'admin').length,
        supervisor: mockProfiles.filter((p)=>p.role === 'supervisor').length,
        auditor: mockProfiles.filter((p)=>p.role === 'auditor').length
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/data/pds.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Mock PDS Submissions
__turbopack_context__.s([
    "getCompletePdsSubmission",
    ()=>getCompletePdsSubmission,
    "getPdsChildrenBySubmissionId",
    ()=>getPdsChildrenBySubmissionId,
    "getPdsCivilServiceBySubmissionId",
    ()=>getPdsCivilServiceBySubmissionId,
    "getPdsEducationBySubmissionId",
    ()=>getPdsEducationBySubmissionId,
    "getPdsFamilyBackgroundBySubmissionId",
    ()=>getPdsFamilyBackgroundBySubmissionId,
    "getPdsOtherInfoBySubmissionId",
    ()=>getPdsOtherInfoBySubmissionId,
    "getPdsPersonalInfoBySubmissionId",
    ()=>getPdsPersonalInfoBySubmissionId,
    "getPdsSubmissionById",
    ()=>getPdsSubmissionById,
    "getPdsSubmissionsByUserId",
    ()=>getPdsSubmissionsByUserId,
    "getPdsTrainingBySubmissionId",
    ()=>getPdsTrainingBySubmissionId,
    "getPdsVoluntaryWorkBySubmissionId",
    ()=>getPdsVoluntaryWorkBySubmissionId,
    "getPdsWorkExperienceBySubmissionId",
    ()=>getPdsWorkExperienceBySubmissionId,
    "mockPdsChildren",
    ()=>mockPdsChildren,
    "mockPdsCivilService",
    ()=>mockPdsCivilService,
    "mockPdsDataSummary",
    ()=>mockPdsDataSummary,
    "mockPdsEducation",
    ()=>mockPdsEducation,
    "mockPdsFamilyBackground",
    ()=>mockPdsFamilyBackground,
    "mockPdsOtherInfo",
    ()=>mockPdsOtherInfo,
    "mockPdsPersonalInfo",
    ()=>mockPdsPersonalInfo,
    "mockPdsSubmissions",
    ()=>mockPdsSubmissions,
    "mockPdsTraining",
    ()=>mockPdsTraining,
    "mockPdsVoluntaryWork",
    ()=>mockPdsVoluntaryWork,
    "mockPdsWorkExperience",
    ()=>mockPdsWorkExperience
]);
const mockPdsSubmissions = [
    {
        id: '01927d4e-8b45-8000-0001-000000000001',
        userId: '01927d4e-8b45-7f52-b123-456789abcdef',
        version: 1,
        status: 'approved',
        submittedAt: new Date('2024-12-15T09:00:00Z'),
        approvedBy: '01927d4e-8b45-7f52-b123-456789abcde0',
        approvedAt: new Date('2024-12-16T14:30:00Z'),
        isLatest: true,
        createdAt: new Date('2024-12-10T08:00:00Z'),
        updatedAt: new Date('2024-12-16T14:30:00Z')
    },
    {
        id: '01927d4e-8b45-8000-0001-000000000002',
        userId: '01927d4e-8b45-7f52-b123-456789abcde0',
        version: 2,
        status: 'submitted',
        submittedAt: new Date('2024-12-20T10:30:00Z'),
        approvedBy: null,
        approvedAt: null,
        isLatest: true,
        createdAt: new Date('2024-12-18T07:15:00Z'),
        updatedAt: new Date('2024-12-20T10:30:00Z')
    },
    {
        id: '01927d4e-8b45-8000-0001-000000000003',
        userId: '01927d4e-8b45-7f52-b123-456789abcde1',
        version: 1,
        status: 'reviewing',
        submittedAt: new Date('2024-12-22T11:45:00Z'),
        approvedBy: null,
        approvedAt: null,
        isLatest: true,
        createdAt: new Date('2024-12-20T09:20:00Z'),
        updatedAt: new Date('2024-12-22T11:45:00Z')
    },
    {
        id: '01927d4e-8b45-8000-0001-000000000004',
        userId: '01927d4e-8b45-7f52-b123-456789abcde4',
        version: 1,
        status: 'draft',
        submittedAt: null,
        approvedBy: null,
        approvedAt: null,
        isLatest: true,
        createdAt: new Date('2024-12-25T13:00:00Z'),
        updatedAt: new Date('2024-12-26T16:45:00Z')
    },
    {
        id: '01927d4e-8b45-8000-0001-000000000005',
        userId: '01927d4e-8b45-7f52-b123-456789abcde7',
        version: 1,
        status: 'rejected',
        submittedAt: new Date('2024-12-18T08:30:00Z'),
        approvedBy: '01927d4e-8b45-7f52-b123-456789abcde6',
        approvedAt: new Date('2024-12-19T15:20:00Z'),
        isLatest: true,
        createdAt: new Date('2024-12-15T10:00:00Z'),
        updatedAt: new Date('2024-12-19T15:20:00Z')
    }
];
const mockPdsPersonalInfo = [
    {
        id: '01927d4e-8b45-8100-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        surname: 'dela Cruz',
        firstName: 'Juan',
        middleName: 'Mercado',
        nameExtension: null,
        dateOfBirth: new Date('1985-06-15'),
        placeOfBirth: 'Quezon City, Metro Manila',
        sex: 'male',
        civilStatus: 'married',
        heightM: 1.75,
        weightKg: 70.5,
        bloodType: 'O+',
        gsisNo: '12-3456789-0',
        pagibigNo: '1234-5678-9012',
        philhealthNo: '12-345678901-2',
        sssNo: '34-5678901-2',
        tinNo: '123-456-789-000',
        agencyEmployeeNo: 'DOST-2023-001',
        citizenship: {
            type: 'Filipino'
        },
        residentialAddress: {
            street: '123 Kamagong Street, Brgy. San Antonio',
            city: 'Quezon City',
            province: 'Metro Manila',
            zipCode: '1100'
        },
        permanentAddress: {
            street: '123 Kamagong Street, Brgy. San Antonio',
            city: 'Quezon City',
            province: 'Metro Manila',
            zipCode: '1100'
        },
        telephoneNo: '+63-2-8123-4567',
        mobileNo: '+63-917-123-4567',
        emailAddress: 'juan.delcruz@dost.gov.ph'
    },
    {
        id: '01927d4e-8b45-8100-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        surname: 'Santos',
        firstName: 'Maria',
        middleName: 'Gonzales',
        nameExtension: null,
        dateOfBirth: new Date('1980-09-23'),
        placeOfBirth: 'Manila, Metro Manila',
        sex: 'female',
        civilStatus: 'married',
        heightM: 1.6,
        weightKg: 55.0,
        bloodType: 'A+',
        gsisNo: '23-4567890-1',
        pagibigNo: '2345-6789-0123',
        philhealthNo: '23-456789012-3',
        sssNo: '45-6789012-3',
        tinNo: '234-567-890-000',
        agencyEmployeeNo: 'DEPED-2023-047',
        citizenship: {
            type: 'Filipino'
        },
        residentialAddress: {
            street: '456 Sampaguita Avenue, Brgy. Maligaya',
            city: 'Pasig City',
            province: 'Metro Manila',
            zipCode: '1600'
        },
        permanentAddress: {
            street: '789 Mahogany Street, Brgy. Pinyahan',
            city: 'Bataan',
            province: 'Bataan',
            zipCode: '2100'
        },
        telephoneNo: '+63-2-8234-5678',
        mobileNo: '+63-918-234-5678',
        emailAddress: 'maria.santos@deped.gov.ph'
    },
    {
        id: '01927d4e-8b45-8100-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000003',
        surname: 'Rizal',
        firstName: 'Jose',
        middleName: 'Protacio',
        nameExtension: null,
        dateOfBirth: new Date('1978-12-30'),
        placeOfBirth: 'Calamba, Laguna',
        sex: 'male',
        civilStatus: 'married',
        heightM: 1.78,
        weightKg: 75.0,
        bloodType: 'B+',
        gsisNo: '34-5678901-2',
        pagibigNo: '3456-7890-1234',
        philhealthNo: '34-567890123-4',
        sssNo: '56-7890123-4',
        tinNo: '345-678-901-000',
        agencyEmployeeNo: 'DOH-2024-089',
        citizenship: {
            type: 'Filipino'
        },
        residentialAddress: {
            street: '789 Narra Street, Brgy. Bagong Bayan',
            city: 'Manila',
            province: 'Metro Manila',
            zipCode: '1000'
        },
        permanentAddress: {
            street: '321 Real Street, Brgy. Poblacion',
            city: 'Calamba',
            province: 'Laguna',
            zipCode: '4027'
        },
        telephoneNo: '+63-2-8345-6789',
        mobileNo: '+63-919-345-6789',
        emailAddress: 'jose.rizal@doh.gov.ph'
    },
    {
        id: '01927d4e-8b45-8100-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000004',
        surname: 'Poe',
        firstName: 'Grace',
        middleName: 'Llamanzares',
        nameExtension: null,
        dateOfBirth: new Date('1968-09-03'),
        placeOfBirth: 'Iloilo City, Iloilo',
        sex: 'female',
        civilStatus: 'married',
        heightM: 1.65,
        weightKg: 58.0,
        bloodType: 'AB+',
        gsisNo: '45-6789012-3',
        pagibigNo: '4567-8901-2345',
        philhealthNo: '45-678901234-5',
        sssNo: '67-8901234-5',
        tinNo: '456-789-012-000',
        agencyEmployeeNo: 'SENATE-2024-033',
        citizenship: {
            type: 'Dual',
            details: 'Filipino-American'
        },
        residentialAddress: {
            street: '654 Malunggay Street, Brgy. San Miguel',
            city: 'San Juan',
            province: 'Metro Manila',
            zipCode: '1500'
        },
        permanentAddress: {
            street: '987 Mabini Street, Brgy. Centro',
            city: 'Iloilo City',
            province: 'Iloilo',
            zipCode: '5000'
        },
        telephoneNo: '+63-2-8456-7890',
        mobileNo: '+63-920-456-7890',
        emailAddress: 'grace.poe@senate.gov.ph'
    },
    {
        id: '01927d4e-8b45-8100-0001-000000000005',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000005',
        surname: 'Lacson',
        firstName: 'Panfilo',
        middleName: 'Morena',
        nameExtension: 'Sr.',
        dateOfBirth: new Date('1948-06-12'),
        placeOfBirth: 'Imus, Cavite',
        sex: 'male',
        civilStatus: 'married',
        heightM: 1.8,
        weightKg: 80.0,
        bloodType: 'O-',
        gsisNo: '56-7890123-4',
        pagibigNo: '5678-9012-3456',
        philhealthNo: '56-789012345-6',
        sssNo: '78-9012345-6',
        tinNo: '567-890-123-000',
        agencyEmployeeNo: 'PNP-2024-156',
        citizenship: {
            type: 'Filipino'
        },
        residentialAddress: {
            street: '111 Acacia Street, Brgy. Magallanes',
            city: 'Makati',
            province: 'Metro Manila',
            zipCode: '1232'
        },
        permanentAddress: {
            street: '222 Rizal Street, Brgy. Poblacion',
            city: 'Imus',
            province: 'Cavite',
            zipCode: '4103'
        },
        telephoneNo: '+63-2-8567-8901',
        mobileNo: '+63-921-567-8901',
        emailAddress: 'panfilo.lacson@pnp.gov.ph'
    }
];
const mockPdsFamilyBackground = [
    {
        id: '01927d4e-8b45-8200-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        spouseSurname: 'Santos',
        spouseFirstName: 'Maria',
        spouseMiddleName: 'Garcia',
        spouseNameExtension: null,
        spouseOccupation: 'Teacher',
        spouseEmployer: 'Department of Education',
        spouseBusinessAddress: '456 Education Avenue, Quezon City',
        spouseTelephoneNo: '+63-2-8234-5678',
        fatherSurname: 'dela Cruz',
        fatherFirstName: 'Pedro',
        fatherMiddleName: 'Bautista',
        motherMaidenSurname: 'Mercado',
        motherFirstName: 'Rosa',
        motherMiddleName: 'Flores'
    },
    {
        id: '01927d4e-8b45-8200-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        spouseSurname: 'Santos',
        spouseFirstName: 'Roberto',
        spouseMiddleName: 'Cruz',
        spouseNameExtension: 'Jr.',
        spouseOccupation: 'Engineer',
        spouseEmployer: 'DPWH',
        spouseBusinessAddress: '789 Infrastructure Blvd, Pasig City',
        spouseTelephoneNo: '+63-2-8345-6789',
        fatherSurname: 'Gonzales',
        fatherFirstName: 'Antonio',
        fatherMiddleName: 'Rivera',
        motherMaidenSurname: 'Cruz',
        motherFirstName: 'Carmen',
        motherMiddleName: 'Ramos'
    },
    {
        id: '01927d4e-8b45-8200-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000003',
        spouseSurname: 'Mercado',
        spouseFirstName: 'Josephine',
        spouseMiddleName: 'Bracken',
        spouseNameExtension: null,
        spouseOccupation: 'Nurse',
        spouseEmployer: 'Philippine General Hospital',
        spouseBusinessAddress: '321 Health Street, Manila',
        spouseTelephoneNo: '+63-2-8456-7890',
        fatherSurname: 'Rizal',
        fatherFirstName: 'Francisco',
        fatherMiddleName: 'Engracio',
        motherMaidenSurname: 'Alonso',
        motherFirstName: 'Teodora',
        motherMiddleName: 'Quintos'
    },
    {
        id: '01927d4e-8b45-8200-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000004',
        spouseSurname: 'Teodoro',
        spouseFirstName: 'Neil',
        spouseMiddleName: 'Cruz',
        spouseNameExtension: null,
        spouseOccupation: 'Pilot',
        spouseEmployer: 'Philippine Airlines',
        spouseBusinessAddress: '654 Aviation Avenue, Pasay City',
        spouseTelephoneNo: '+63-2-8567-8901',
        fatherSurname: 'Llamanzares',
        fatherFirstName: 'Fernando',
        fatherMiddleName: 'Cruz',
        motherMaidenSurname: 'Poe',
        motherFirstName: 'Susan',
        motherMiddleName: 'Roces'
    },
    {
        id: '01927d4e-8b45-8200-0001-000000000005',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000005',
        spouseSurname: 'Ejercito',
        spouseFirstName: 'Alice',
        spouseMiddleName: 'Gonzales',
        spouseNameExtension: null,
        spouseOccupation: 'Businesswoman',
        spouseEmployer: 'Private Business',
        spouseBusinessAddress: '987 Commerce Street, Makati City',
        spouseTelephoneNo: '+63-2-8678-9012',
        fatherSurname: 'Lacson',
        fatherFirstName: 'Arsenio',
        fatherMiddleName: 'Cruz',
        motherMaidenSurname: 'Morena',
        motherFirstName: 'Pacita',
        motherMiddleName: 'Santos'
    }
];
const mockPdsChildren = [
    {
        id: '01927d4e-8b45-8300-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        fullName: 'Juan Carlos M. dela Cruz',
        dateOfBirth: new Date('2010-03-15')
    },
    {
        id: '01927d4e-8b45-8300-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        fullName: 'Maria Isabella M. dela Cruz',
        dateOfBirth: new Date('2012-07-22')
    },
    {
        id: '01927d4e-8b45-8300-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        fullName: 'Roberto Jr. C. Santos',
        dateOfBirth: new Date('2008-11-08')
    },
    {
        id: '01927d4e-8b45-8300-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        fullName: 'Ana Sofia C. Santos',
        dateOfBirth: new Date('2011-04-30')
    },
    {
        id: '01927d4e-8b45-8300-0001-000000000005',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000003',
        fullName: 'Jose Francisco B. Rizal',
        dateOfBirth: new Date('2005-12-30')
    },
    {
        id: '01927d4e-8b45-8300-0001-000000000006',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000004',
        fullName: 'Brian Patrick C. Poe',
        dateOfBirth: new Date('2000-01-15')
    },
    {
        id: '01927d4e-8b45-8300-0001-000000000007',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000004',
        fullName: 'Hanna Grace C. Poe',
        dateOfBirth: new Date('2002-08-20')
    }
];
const mockPdsEducation = [
    // Juan dela Cruz education
    {
        id: '01927d4e-8b45-8400-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        level: 'elementary',
        schoolName: 'Quezon City Elementary School',
        degreeCourse: null,
        periodFrom: new Date('1991-06-01'),
        periodTo: new Date('1997-03-31'),
        highestLevelEarned: 'Grade 6',
        yearGraduated: 1997,
        honorsReceived: 'With Honors'
    },
    {
        id: '01927d4e-8b45-8400-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        level: 'secondary',
        schoolName: 'Quezon City High School',
        degreeCourse: null,
        periodFrom: new Date('1997-06-01'),
        periodTo: new Date('2001-03-31'),
        highestLevelEarned: '4th Year',
        yearGraduated: 2001,
        honorsReceived: 'Salutatorian'
    },
    {
        id: '01927d4e-8b45-8400-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        level: 'college',
        schoolName: 'University of the Philippines Diliman',
        degreeCourse: 'Bachelor of Science in Chemistry',
        periodFrom: new Date('2001-06-01'),
        periodTo: new Date('2005-03-31'),
        highestLevelEarned: "Bachelor's Degree",
        yearGraduated: 2005,
        honorsReceived: 'Magna Cum Laude'
    },
    {
        id: '01927d4e-8b45-8400-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        level: 'graduate',
        schoolName: 'University of the Philippines Diliman',
        degreeCourse: 'Master of Science in Chemistry',
        periodFrom: new Date('2006-06-01'),
        periodTo: new Date('2008-03-31'),
        highestLevelEarned: "Master's Degree",
        yearGraduated: 2008,
        honorsReceived: 'Summa Cum Laude'
    },
    // Maria Santos education
    {
        id: '01927d4e-8b45-8400-0001-000000000005',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        level: 'elementary',
        schoolName: 'Manila Elementary School',
        degreeCourse: null,
        periodFrom: new Date('1986-06-01'),
        periodTo: new Date('1992-03-31'),
        highestLevelEarned: 'Grade 6',
        yearGraduated: 1992,
        honorsReceived: null
    },
    {
        id: '01927d4e-8b45-8400-0001-000000000006',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        level: 'secondary',
        schoolName: "St. Scholastica's College Manila",
        degreeCourse: null,
        periodFrom: new Date('1992-06-01'),
        periodTo: new Date('1996-03-31'),
        highestLevelEarned: '4th Year',
        yearGraduated: 1996,
        honorsReceived: 'With High Honors'
    },
    {
        id: '01927d4e-8b45-8400-0001-000000000007',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        level: 'college',
        schoolName: 'Philippine Normal University',
        degreeCourse: 'Bachelor of Elementary Education',
        periodFrom: new Date('1996-06-01'),
        periodTo: new Date('2000-03-31'),
        highestLevelEarned: "Bachelor's Degree",
        yearGraduated: 2000,
        honorsReceived: 'Cum Laude'
    },
    {
        id: '01927d4e-8b45-8400-0001-000000000008',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        level: 'graduate',
        schoolName: 'University of the Philippines Diliman',
        degreeCourse: 'Master of Arts in Education',
        periodFrom: new Date('2010-06-01'),
        periodTo: new Date('2012-03-31'),
        highestLevelEarned: "Master's Degree",
        yearGraduated: 2012,
        honorsReceived: null
    }
];
const mockPdsCivilService = [
    {
        id: '01927d4e-8b45-8500-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        eligibilityName: 'Career Service Professional',
        rating: 85.5,
        dateOfExam: new Date('2005-10-15'),
        placeOfExam: 'Quezon City',
        licenseNo: 'CSP-2005-QC-12345',
        licenseValidityDate: null
    },
    {
        id: '01927d4e-8b45-8500-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        eligibilityName: 'Licensure Examination for Teachers',
        rating: 78.25,
        dateOfExam: new Date('2000-08-20'),
        placeOfExam: 'Manila',
        licenseNo: 'LET-2000-MN-67890',
        licenseValidityDate: null
    },
    {
        id: '01927d4e-8b45-8500-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000003',
        eligibilityName: 'Physician Licensure Examination',
        rating: 82.75,
        dateOfExam: new Date('2003-03-10'),
        placeOfExam: 'Manila',
        licenseNo: 'MD-2003-MN-11111',
        licenseValidityDate: new Date('2026-03-10')
    },
    {
        id: '01927d4e-8b45-8500-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000004',
        eligibilityName: 'Career Service Professional',
        rating: 90.0,
        dateOfExam: new Date('1995-05-25'),
        placeOfExam: 'Iloilo City',
        licenseNo: 'CSP-1995-IL-22222',
        licenseValidityDate: null
    },
    {
        id: '01927d4e-8b45-8500-0001-000000000005',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000005',
        eligibilityName: 'Philippine Military Academy Graduate',
        rating: null,
        dateOfExam: new Date('1971-03-22'),
        placeOfExam: 'Baguio City',
        licenseNo: 'PMA-1971-BC-33333',
        licenseValidityDate: null
    }
];
const mockPdsWorkExperience = [
    // Juan dela Cruz work experience
    {
        id: '01927d4e-8b45-8600-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        positionTitle: 'Research Assistant',
        departmentAgency: 'Department of Science and Technology',
        monthlySalary: 25000.0,
        salaryGrade: '15',
        statusOfAppointment: 'Permanent',
        isGovernment: true,
        dateFrom: new Date('2008-07-01'),
        dateTo: new Date('2011-06-30')
    },
    {
        id: '01927d4e-8b45-8600-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        positionTitle: 'Science Research Specialist I',
        departmentAgency: 'Department of Science and Technology',
        monthlySalary: 35000.0,
        salaryGrade: '18',
        statusOfAppointment: 'Permanent',
        isGovernment: true,
        dateFrom: new Date('2011-07-01'),
        dateTo: new Date('2015-12-31')
    },
    {
        id: '01927d4e-8b45-8600-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        positionTitle: 'Science Research Specialist II',
        departmentAgency: 'Department of Science and Technology',
        monthlySalary: 48000.0,
        salaryGrade: '22',
        statusOfAppointment: 'Permanent',
        isGovernment: true,
        dateFrom: new Date('2016-01-01'),
        dateTo: null
    },
    // Maria Santos work experience
    {
        id: '01927d4e-8b45-8600-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        positionTitle: 'Teacher I',
        departmentAgency: 'Department of Education',
        monthlySalary: 22000.0,
        salaryGrade: '11',
        statusOfAppointment: 'Permanent',
        isGovernment: true,
        dateFrom: new Date('2000-06-01'),
        dateTo: new Date('2005-05-31')
    },
    {
        id: '01927d4e-8b45-8600-0001-000000000005',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        positionTitle: 'Teacher II',
        departmentAgency: 'Department of Education',
        monthlySalary: 28000.0,
        salaryGrade: '12',
        statusOfAppointment: 'Permanent',
        isGovernment: true,
        dateFrom: new Date('2005-06-01'),
        dateTo: new Date('2012-05-31')
    },
    {
        id: '01927d4e-8b45-8600-0001-000000000006',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        positionTitle: 'Teacher III',
        departmentAgency: 'Department of Education',
        monthlySalary: 33000.0,
        salaryGrade: '18',
        statusOfAppointment: 'Permanent',
        isGovernment: true,
        dateFrom: new Date('2012-06-01'),
        dateTo: null
    }
];
const mockPdsVoluntaryWork = [
    {
        id: '01927d4e-8b45-8700-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        organizationName: 'Philippine Red Cross',
        organizationAddress: '123 Red Cross Street, Manila',
        dateFrom: new Date('2010-01-15'),
        dateTo: new Date('2012-12-31'),
        numberOfHours: 240,
        positionNature: 'Volunteer Blood Donor Recruiter'
    },
    {
        id: '01927d4e-8b45-8700-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        organizationName: 'Gawad Kalinga',
        organizationAddress: '456 Community Street, Quezon City',
        dateFrom: new Date('2008-03-01'),
        dateTo: new Date('2015-06-30'),
        numberOfHours: 500,
        positionNature: 'Community Development Volunteer'
    },
    {
        id: '01927d4e-8b45-8700-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000003',
        organizationName: 'Doctors Without Borders Philippines',
        organizationAddress: '789 Medical Street, Manila',
        dateFrom: new Date('2015-08-01'),
        dateTo: new Date('2018-07-31'),
        numberOfHours: 720,
        positionNature: 'Medical Mission Volunteer'
    }
];
const mockPdsTraining = [
    {
        id: '01927d4e-8b45-8800-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        title: 'Laboratory Safety and Chemical Handling',
        dateFrom: new Date('2009-02-15'),
        dateTo: new Date('2009-02-19'),
        hours: 40,
        typeOfLd: 'Technical',
        conductedBy: 'Department of Science and Technology'
    },
    {
        id: '01927d4e-8b45-8800-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        title: 'Research Methodology and Statistical Analysis',
        dateFrom: new Date('2012-08-20'),
        dateTo: new Date('2012-08-24'),
        hours: 40,
        typeOfLd: 'Technical',
        conductedBy: 'University of the Philippines'
    },
    {
        id: '01927d4e-8b45-8800-0001-000000000003',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        title: 'Modern Teaching Methods in Elementary Education',
        dateFrom: new Date('2013-05-10'),
        dateTo: new Date('2013-05-14'),
        hours: 40,
        typeOfLd: 'Professional',
        conductedBy: 'Department of Education'
    },
    {
        id: '01927d4e-8b45-8800-0001-000000000004',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        title: 'Child Psychology and Development',
        dateFrom: new Date('2016-11-07'),
        dateTo: new Date('2016-11-11'),
        hours: 40,
        typeOfLd: 'Professional',
        conductedBy: 'Philippine Normal University'
    }
];
const mockPdsOtherInfo = [
    {
        id: '01927d4e-8b45-8900-0001-000000000001',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000001',
        skills: [
            'Chemical Analysis',
            'Laboratory Management',
            'Research and Development',
            'Data Analysis',
            'Scientific Writing',
            'Microsoft Office Suite',
            'SPSS'
        ],
        recognitions: [
            {
                title: 'Outstanding Research Scientist Award',
                year: 2018,
                organization: 'Department of Science and Technology'
            },
            {
                title: 'Best Paper Award',
                year: 2020,
                organization: 'Philippine Chemical Society'
            }
        ],
        associations: [
            {
                name: 'Philippine Chemical Society',
                position: 'Member',
                yearJoined: 2008
            },
            {
                name: 'International Association of Analytical Chemists',
                position: 'Associate Member',
                yearJoined: 2015
            }
        ],
        questions: {
            Q34_criminal_charged: false,
            Q35_criminal_convicted: false,
            Q36_separated_from_service: false,
            Q37_candidate_for_election: false,
            Q38_resigned_from_government: false,
            Q39_immigrant_or_acquired_residence: false,
            Q40_indigenous_group: false,
            Q40_indigenous_group_details: '',
            Q41_disabled: false,
            Q41_disabled_details: '',
            Q42_solo_parent: false,
            Q42_solo_parent_details: ''
        },
        references: [
            {
                name: 'Dr. Maria Clara Reyes',
                address: '456 Science Avenue, Quezon City',
                telephoneNo: '+63-2-8123-4567'
            },
            {
                name: 'Prof. Antonio Santos',
                address: '789 University Street, Manila',
                telephoneNo: '+63-2-8234-5678'
            },
            {
                name: 'Engr. Rosa Martinez',
                address: '321 Technology Boulevard, Pasig City',
                telephoneNo: '+63-2-8345-6789'
            }
        ]
    },
    {
        id: '01927d4e-8b45-8900-0001-000000000002',
        pdsSubmissionId: '01927d4e-8b45-8000-0001-000000000002',
        skills: [
            'Classroom Management',
            'Curriculum Development',
            'Student Assessment',
            'Educational Technology',
            'Child Psychology',
            'Microsoft Office',
            'Google Workspace'
        ],
        recognitions: [
            {
                title: 'Outstanding Teacher Award',
                year: 2019,
                organization: 'Department of Education'
            },
            {
                title: 'Excellence in Teaching Award',
                year: 2021,
                organization: 'Quezon City Schools Division'
            }
        ],
        associations: [
            {
                name: 'Teachers Association of the Philippines',
                position: 'Chapter President',
                yearJoined: 2005
            },
            {
                name: 'Philippine Elementary School Teachers Association',
                position: 'Member',
                yearJoined: 2000
            }
        ],
        questions: {
            Q34_criminal_charged: false,
            Q35_criminal_convicted: false,
            Q36_separated_from_service: false,
            Q37_candidate_for_election: false,
            Q38_resigned_from_government: false,
            Q39_immigrant_or_acquired_residence: false,
            Q40_indigenous_group: false,
            Q40_indigenous_group_details: '',
            Q41_disabled: false,
            Q41_disabled_details: '',
            Q42_solo_parent: false,
            Q42_solo_parent_details: ''
        },
        references: [
            {
                name: 'Dr. Carmen Lopez',
                address: '111 Education Street, Manila',
                telephoneNo: '+63-2-8111-2222'
            },
            {
                name: 'Principal Elena Fernandez',
                address: '222 School Avenue, Quezon City',
                telephoneNo: '+63-2-8333-4444'
            },
            {
                name: 'Mrs. Gloria Hernandez',
                address: '333 Community Road, Pasig City',
                telephoneNo: '+63-2-8555-6666'
            }
        ]
    }
];
function getPdsSubmissionById(id) {
    return mockPdsSubmissions.find((pds)=>pds.id === id);
}
function getPdsSubmissionsByUserId(userId) {
    return mockPdsSubmissions.filter((pds)=>pds.userId === userId);
}
function getPdsPersonalInfoBySubmissionId(submissionId) {
    return mockPdsPersonalInfo.find((info)=>info.pdsSubmissionId === submissionId);
}
function getPdsFamilyBackgroundBySubmissionId(submissionId) {
    return mockPdsFamilyBackground.find((family)=>family.pdsSubmissionId === submissionId);
}
function getPdsChildrenBySubmissionId(submissionId) {
    return mockPdsChildren.filter((child)=>child.pdsSubmissionId === submissionId);
}
function getPdsEducationBySubmissionId(submissionId) {
    return mockPdsEducation.filter((edu)=>edu.pdsSubmissionId === submissionId);
}
function getPdsCivilServiceBySubmissionId(submissionId) {
    return mockPdsCivilService.filter((cs)=>cs.pdsSubmissionId === submissionId);
}
function getPdsWorkExperienceBySubmissionId(submissionId) {
    return mockPdsWorkExperience.filter((work)=>work.pdsSubmissionId === submissionId);
}
function getPdsVoluntaryWorkBySubmissionId(submissionId) {
    return mockPdsVoluntaryWork.filter((vol)=>vol.pdsSubmissionId === submissionId);
}
function getPdsTrainingBySubmissionId(submissionId) {
    return mockPdsTraining.filter((training)=>training.pdsSubmissionId === submissionId);
}
function getPdsOtherInfoBySubmissionId(submissionId) {
    return mockPdsOtherInfo.find((info)=>info.pdsSubmissionId === submissionId);
}
function getCompletePdsSubmission(submissionId) {
    const submission = getPdsSubmissionById(submissionId);
    if (!submission) return null;
    return {
        submission,
        personalInfo: getPdsPersonalInfoBySubmissionId(submissionId),
        familyBackground: getPdsFamilyBackgroundBySubmissionId(submissionId),
        children: getPdsChildrenBySubmissionId(submissionId),
        education: getPdsEducationBySubmissionId(submissionId),
        civilService: getPdsCivilServiceBySubmissionId(submissionId),
        workExperience: getPdsWorkExperienceBySubmissionId(submissionId),
        voluntaryWork: getPdsVoluntaryWorkBySubmissionId(submissionId),
        training: getPdsTrainingBySubmissionId(submissionId),
        otherInfo: getPdsOtherInfoBySubmissionId(submissionId)
    };
}
const mockPdsDataSummary = {
    submissions: mockPdsSubmissions.length,
    personalInfo: mockPdsPersonalInfo.length,
    familyBackground: mockPdsFamilyBackground.length,
    children: mockPdsChildren.length,
    education: mockPdsEducation.length,
    civilService: mockPdsCivilService.length,
    workExperience: mockPdsWorkExperience.length,
    voluntaryWork: mockPdsVoluntaryWork.length,
    training: mockPdsTraining.length,
    otherInfo: mockPdsOtherInfo.length,
    statuses: {
        draft: mockPdsSubmissions.filter((s)=>s.status === 'draft').length,
        submitted: mockPdsSubmissions.filter((s)=>s.status === 'submitted').length,
        reviewing: mockPdsSubmissions.filter((s)=>s.status === 'reviewing').length,
        approved: mockPdsSubmissions.filter((s)=>s.status === 'approved').length,
        rejected: mockPdsSubmissions.filter((s)=>s.status === 'rejected').length
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/data/saln.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "filipinoGivenNames",
    ()=>filipinoGivenNames,
    "filipinoSurnames",
    ()=>filipinoSurnames,
    "generateMockRealProperty",
    ()=>generateMockRealProperty,
    "generateMockSalnSubmission",
    ()=>generateMockSalnSubmission,
    "getCompleteSalnSubmission",
    ()=>getCompleteSalnSubmission,
    "getSalnBusinessInterestsBySubmissionId",
    ()=>getSalnBusinessInterestsBySubmissionId,
    "getSalnLiabilitiesBySubmissionId",
    ()=>getSalnLiabilitiesBySubmissionId,
    "getSalnPersonalPropertiesBySubmissionId",
    ()=>getSalnPersonalPropertiesBySubmissionId,
    "getSalnRealPropertiesBySubmissionId",
    ()=>getSalnRealPropertiesBySubmissionId,
    "getSalnRelativesInGovBySubmissionId",
    ()=>getSalnRelativesInGovBySubmissionId,
    "getSalnSubmissionById",
    ()=>getSalnSubmissionById,
    "getSalnSubmissionsByUserId",
    ()=>getSalnSubmissionsByUserId,
    "getSalnSubmissionsByYear",
    ()=>getSalnSubmissionsByYear,
    "mockSalnBusinessInterests",
    ()=>mockSalnBusinessInterests,
    "mockSalnDataSummary",
    ()=>mockSalnDataSummary,
    "mockSalnLiabilities",
    ()=>mockSalnLiabilities,
    "mockSalnPersonalProperties",
    ()=>mockSalnPersonalProperties,
    "mockSalnRealProperties",
    ()=>mockSalnRealProperties,
    "mockSalnRelativesInGov",
    ()=>mockSalnRelativesInGov,
    "mockSalnSubmissions",
    ()=>mockSalnSubmissions,
    "philippineCities",
    ()=>philippineCities
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/node_modules/uuid/dist/esm-browser/v7.js [app-client] (ecmascript) <export default as v7>");
;
const mockSalnSubmissions = [
    {
        id: "01927d4e-8b45-9000-0001-000000000001",
        userId: "01927d4e-8b45-7f52-b123-456789abcdef",
        year: 2024,
        status: "approved",
        totalAssets: '8750000.00',
        totalLiabilities: '2500000.00',
        netWorth: '6250000.00',
        submittedAt: new Date('2024-04-15T10:00:00Z'),
        approvedBy: "01927d4e-8b45-7f52-b123-456789abcde2",
        approvedAt: new Date('2024-04-20T14:30:00Z'),
        filingType: "separate",
        createdAt: new Date('2024-04-01T08:00:00Z'),
        updatedAt: new Date('2024-04-20T14:30:00Z')
    },
    {
        id: "01927d4e-8b45-9000-0001-000000000002",
        userId: "01927d4e-8b45-7f52-b123-456789abcdef",
        year: 2023,
        status: "approved",
        totalAssets: '8200000.00',
        totalLiabilities: '2800000.00',
        netWorth: '5400000.00',
        submittedAt: new Date('2023-04-10T09:30:00Z'),
        approvedBy: "01927d4e-8b45-7f52-b123-456789abcde2",
        approvedAt: new Date('2023-04-15T16:00:00Z'),
        filingType: "separate",
        createdAt: new Date('2023-03-25T07:15:00Z'),
        updatedAt: new Date('2023-04-15T16:00:00Z')
    },
    {
        id: "01927d4e-8b45-9000-0001-000000000003",
        userId: "01927d4e-8b45-7f52-b123-456789abcde0",
        year: 2024,
        status: "submitted",
        totalAssets: '5600000.00',
        totalLiabilities: '1800000.00',
        netWorth: '3800000.00',
        submittedAt: new Date('2024-04-12T11:15:00Z'),
        approvedBy: null,
        approvedAt: null,
        filingType: "joint",
        createdAt: new Date('2024-04-05T09:00:00Z'),
        updatedAt: new Date('2024-04-12T11:15:00Z')
    },
    {
        id: "01927d4e-8b45-9000-0001-000000000004",
        userId: "01927d4e-8b45-7f52-b123-456789abcde1",
        year: 2024,
        status: "reviewing",
        totalAssets: '12500000.00',
        totalLiabilities: '3200000.00',
        netWorth: '9300000.00',
        submittedAt: new Date('2024-04-08T14:45:00Z'),
        approvedBy: null,
        approvedAt: null,
        filingType: "separate",
        createdAt: new Date('2024-03-30T10:30:00Z'),
        updatedAt: new Date('2024-04-08T14:45:00Z')
    },
    {
        id: "01927d4e-8b45-9000-0001-000000000005",
        userId: "01927d4e-8b45-7f52-b123-456789abcde4",
        year: 2024,
        status: "draft",
        totalAssets: '15000000.00',
        totalLiabilities: '4500000.00',
        netWorth: '10500000.00',
        submittedAt: null,
        approvedBy: null,
        approvedAt: null,
        filingType: "joint",
        createdAt: new Date('2024-04-20T13:00:00Z'),
        updatedAt: new Date('2024-04-25T15:30:00Z')
    },
    {
        id: "01927d4e-8b45-9000-0001-000000000006",
        userId: "01927d4e-8b45-7f52-b123-456789abcde7",
        year: 2024,
        status: "rejected",
        totalAssets: '6800000.00',
        totalLiabilities: '2100000.00',
        netWorth: '4700000.00',
        submittedAt: new Date('2024-04-05T12:20:00Z'),
        approvedBy: "01927d4e-8b45-7f52-b123-456789abcde2",
        approvedAt: new Date('2024-04-10T09:45:00Z'),
        filingType: "separate",
        createdAt: new Date('2024-03-28T11:00:00Z'),
        updatedAt: new Date('2024-04-10T09:45:00Z')
    }
];
const mockSalnRealProperties = [
    // Juan dela Cruz properties
    {
        id: "01927d4e-8b45-9100-0001-000000000001",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        description: "3-bedroom house and lot",
        kind: "residential",
        exactLocation: "123 Kamagong Street, Brgy. San Antonio, Quezon City",
        assessedValue: 2500000.00,
        currentFairMarketValue: 4500000.00,
        acquisitionYear: 2015,
        acquisitionMode: "Purchase",
        acquisitionCost: 3200000.00
    },
    {
        id: "01927d4e-8b45-9100-0001-000000000002",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        description: "Vacant lot",
        kind: "residential",
        exactLocation: "456 Narra Avenue, Brgy. Maligaya, Antipolo City",
        assessedValue: 800000.00,
        currentFairMarketValue: 1200000.00,
        acquisitionYear: 2020,
        acquisitionMode: "Purchase",
        acquisitionCost: 950000.00
    },
    // Maria Santos properties
    {
        id: "01927d4e-8b45-9100-0001-000000000003",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        description: "2-bedroom condominium unit",
        kind: "residential",
        exactLocation: "Unit 1205, Sampaguita Tower, Pasig City",
        assessedValue: 1800000.00,
        currentFairMarketValue: 2800000.00,
        acquisitionYear: 2018,
        acquisitionMode: "Purchase",
        acquisitionCost: 2200000.00
    },
    {
        id: "01927d4e-8b45-9100-0001-000000000004",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        description: "Ancestral house",
        kind: "residential",
        exactLocation: "789 Mahogany Street, Brgy. Pinyahan, Bataan",
        assessedValue: 1200000.00,
        currentFairMarketValue: 1800000.00,
        acquisitionYear: 2010,
        acquisitionMode: "Inheritance",
        acquisitionCost: 0.00
    },
    // Jose Rizal properties
    {
        id: "01927d4e-8b45-9100-0001-000000000005",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        description: "4-bedroom house and lot",
        kind: "residential",
        exactLocation: "789 Narra Street, Brgy. Bagong Bayan, Manila",
        assessedValue: 3500000.00,
        currentFairMarketValue: 6500000.00,
        acquisitionYear: 2012,
        acquisitionMode: "Purchase",
        acquisitionCost: 4800000.00
    },
    {
        id: "01927d4e-8b45-9100-0001-000000000006",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        description: "Medical clinic building",
        kind: "commercial",
        exactLocation: "321 Health Street, Brgy. Poblacion, Calamba, Laguna",
        assessedValue: 2800000.00,
        currentFairMarketValue: 4200000.00,
        acquisitionYear: 2019,
        acquisitionMode: "Purchase",
        acquisitionCost: 3500000.00
    },
    // Grace Poe properties
    {
        id: "01927d4e-8b45-9100-0001-000000000007",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        description: "5-bedroom house and lot",
        kind: "residential",
        exactLocation: "654 Malunggay Street, Brgy. San Miguel, San Juan City",
        assessedValue: 5200000.00,
        currentFairMarketValue: 8500000.00,
        acquisitionYear: 2005,
        acquisitionMode: "Purchase",
        acquisitionCost: 6200000.00
    },
    {
        id: "01927d4e-8b45-9100-0001-000000000008",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        description: "Farm land",
        kind: "agricultural",
        exactLocation: "987 Mabini Street, Brgy. Centro, Iloilo City",
        assessedValue: 2500000.00,
        currentFairMarketValue: 3800000.00,
        acquisitionYear: 2010,
        acquisitionMode: "Inheritance",
        acquisitionCost: 0.00
    }
];
const mockSalnPersonalProperties = [
    // Juan dela Cruz personal properties
    {
        id: "01927d4e-8b45-9200-0001-000000000001",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        description: "2022 Toyota Camry",
        yearAcquired: 2022,
        acquisitionCost: 1800000.00
    },
    {
        id: "01927d4e-8b45-9200-0001-000000000002",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        description: "Jewelry and Watches Collection",
        yearAcquired: 2020,
        acquisitionCost: 350000.00
    },
    {
        id: "01927d4e-8b45-9200-0001-000000000003",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        description: "Electronics and Appliances",
        yearAcquired: 2021,
        acquisitionCost: 450000.00
    },
    // Maria Santos personal properties
    {
        id: "01927d4e-8b45-9200-0001-000000000004",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        description: "2020 Honda CR-V",
        yearAcquired: 2020,
        acquisitionCost: 1650000.00
    },
    {
        id: "01927d4e-8b45-9200-0001-000000000005",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        description: "Furniture and Fixtures",
        yearAcquired: 2018,
        acquisitionCost: 280000.00
    },
    // Jose Rizal personal properties
    {
        id: "01927d4e-8b45-9200-0001-000000000006",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        description: "2023 BMW X5",
        yearAcquired: 2023,
        acquisitionCost: 4200000.00
    },
    {
        id: "01927d4e-8b45-9200-0001-000000000007",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        description: "Medical Equipment for Private Practice",
        yearAcquired: 2019,
        acquisitionCost: 1200000.00
    },
    {
        id: "01927d4e-8b45-9200-0001-000000000008",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        description: "Art Collection",
        yearAcquired: 2021,
        acquisitionCost: 600000.00
    },
    // Grace Poe personal properties
    {
        id: "01927d4e-8b45-9200-0001-000000000009",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        description: "2024 Mercedes-Benz GLE",
        yearAcquired: 2024,
        acquisitionCost: 5200000.00
    },
    {
        id: "01927d4e-8b45-9200-0001-000000000010",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        description: "Investment Portfolio (Stocks and Bonds)",
        yearAcquired: 2015,
        acquisitionCost: 2500000.00
    }
];
const mockSalnLiabilities = [
    // Juan dela Cruz liabilities
    {
        id: "01927d4e-8b45-9300-0001-000000000001",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        nature: "Home Mortgage Loan",
        creditorName: "BPI Family Savings Bank",
        outstandingBalance: 1800000.00
    },
    {
        id: "01927d4e-8b45-9300-0001-000000000002",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        nature: "Car Loan",
        creditorName: "Toyota Motor Philippines",
        outstandingBalance: 650000.00
    },
    {
        id: "01927d4e-8b45-9300-0001-000000000003",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        nature: "Credit Card",
        creditorName: "BDO Unibank",
        outstandingBalance: 50000.00
    },
    // Maria Santos liabilities
    {
        id: "01927d4e-8b45-9300-0001-000000000004",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        nature: "Condominium Loan",
        creditorName: "Metrobank",
        outstandingBalance: 1200000.00
    },
    {
        id: "01927d4e-8b45-9300-0001-000000000005",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        nature: "Personal Loan",
        creditorName: "Security Bank",
        outstandingBalance: 350000.00
    },
    {
        id: "01927d4e-8b45-9300-0001-000000000006",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        nature: "Credit Card",
        creditorName: "Citibank Philippines",
        outstandingBalance: 250000.00
    },
    // Jose Rizal liabilities
    {
        id: "01927d4e-8b45-9300-0001-000000000007",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        nature: "Clinic Equipment Loan",
        creditorName: "Rizal Commercial Banking Corporation",
        outstandingBalance: 2200000.00
    },
    {
        id: "01927d4e-8b45-9300-0001-000000000008",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        nature: "Car Loan",
        creditorName: "BMW Financial Services",
        outstandingBalance: 1000000.00
    },
    // Grace Poe liabilities
    {
        id: "01927d4e-8b45-9300-0001-000000000009",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        nature: "Investment Property Loan",
        creditorName: "Philippine National Bank",
        outstandingBalance: 3500000.00
    },
    {
        id: "01927d4e-8b45-9300-0001-000000000010",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        nature: "Business Loan",
        creditorName: "Land Bank of the Philippines",
        outstandingBalance: 1000000.00
    }
];
const mockSalnBusinessInterests = [
    {
        id: "01927d4e-8b45-9400-0001-000000000001",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        entityName: "Santos Educational Services",
        businessAddress: "789 Learning Street, Quezon City",
        natureOfBusiness: "Tutorial and Review Services",
        dateOfAcquisition: new Date('2015-08-15')
    },
    {
        id: "01927d4e-8b45-9400-0001-000000000002",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        entityName: "Rizal Medical Clinic",
        businessAddress: "321 Health Street, Calamba, Laguna",
        natureOfBusiness: "Medical Services and Consultation",
        dateOfAcquisition: new Date('2019-03-10')
    },
    {
        id: "01927d4e-8b45-9400-0001-000000000003",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        entityName: "Poe Agricultural Ventures",
        businessAddress: "987 Farm Road, Iloilo City",
        natureOfBusiness: "Agricultural Production and Trading",
        dateOfAcquisition: new Date('2012-06-20')
    },
    {
        id: "01927d4e-8b45-9400-0001-000000000004",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        entityName: "Grace Poe Foundation",
        businessAddress: "111 Service Avenue, Makati City",
        natureOfBusiness: "Non-profit Educational Foundation",
        dateOfAcquisition: new Date('2008-12-01')
    }
];
const mockSalnRelativesInGov = [
    {
        id: "01927d4e-8b45-9500-0001-000000000001",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000001",
        name: "Pedro M. dela Cruz",
        relationship: "Father",
        position: "Retired Principal",
        agencyAddress: "Former DepEd Quezon City Division"
    },
    {
        id: "01927d4e-8b45-9500-0001-000000000002",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        name: "Antonio R. Gonzales",
        relationship: "Father",
        position: "Engineering Assistant",
        agencyAddress: "DPWH Central Office, Manila"
    },
    {
        id: "01927d4e-8b45-9500-0001-000000000003",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000003",
        name: "Carmen R. Santos",
        relationship: "Sister",
        position: "Budget Officer II",
        agencyAddress: "Department of Budget and Management, Manila"
    },
    {
        id: "01927d4e-8b45-9500-0001-000000000004",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000004",
        name: "Francisco E. Rizal",
        relationship: "Brother",
        position: "City Health Officer",
        agencyAddress: "Calamba City Health Office, Laguna"
    },
    {
        id: "01927d4e-8b45-9500-0001-000000000005",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        name: "Fernando P. Poe",
        relationship: "Father",
        position: "Retired Senator",
        agencyAddress: "Former Senate of the Philippines"
    },
    {
        id: "01927d4e-8b45-9500-0001-000000000006",
        salnSubmissionId: "01927d4e-8b45-9000-0001-000000000005",
        name: "Neil T. Poe",
        relationship: "Spouse",
        position: "Consultant",
        agencyAddress: "Civil Aviation Authority of the Philippines"
    }
];
function getSalnSubmissionById(id) {
    return mockSalnSubmissions.find((saln)=>saln.id === id);
}
function getSalnSubmissionsByUserId(userId) {
    return mockSalnSubmissions.filter((saln)=>saln.userId === userId);
}
function getSalnSubmissionsByYear(year) {
    return mockSalnSubmissions.filter((saln)=>saln.year === year);
}
function getSalnRealPropertiesBySubmissionId(submissionId) {
    return mockSalnRealProperties.filter((prop)=>prop.salnSubmissionId === submissionId);
}
function getSalnPersonalPropertiesBySubmissionId(submissionId) {
    return mockSalnPersonalProperties.filter((prop)=>prop.salnSubmissionId === submissionId);
}
function getSalnLiabilitiesBySubmissionId(submissionId) {
    return mockSalnLiabilities.filter((liability)=>liability.salnSubmissionId === submissionId);
}
function getSalnBusinessInterestsBySubmissionId(submissionId) {
    return mockSalnBusinessInterests.filter((business)=>business.salnSubmissionId === submissionId);
}
function getSalnRelativesInGovBySubmissionId(submissionId) {
    return mockSalnRelativesInGov.filter((relative)=>relative.salnSubmissionId === submissionId);
}
function getCompleteSalnSubmission(submissionId) {
    const submission = getSalnSubmissionById(submissionId);
    if (!submission) return null;
    const realProperties = getSalnRealPropertiesBySubmissionId(submissionId);
    const personalProperties = getSalnPersonalPropertiesBySubmissionId(submissionId);
    const liabilities = getSalnLiabilitiesBySubmissionId(submissionId);
    const businessInterests = getSalnBusinessInterestsBySubmissionId(submissionId);
    const relativesInGov = getSalnRelativesInGovBySubmissionId(submissionId);
    // Recalculate totals (should match submission totals)
    const totalRealPropertyValue = realProperties.reduce((sum, prop)=>sum + prop.currentFairMarketValue, 0);
    const totalPersonalPropertyValue = personalProperties.reduce((sum, prop)=>sum + prop.acquisitionCost, 0);
    const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;
    const totalLiabilities = liabilities.reduce((sum, liability)=>sum + liability.outstandingBalance, 0);
    const netWorth = totalAssets - totalLiabilities;
    return {
        submission,
        realProperties,
        personalProperties,
        liabilities,
        businessInterests,
        relativesInGov,
        calculations: {
            totalRealPropertyValue,
            totalPersonalPropertyValue,
            totalAssets,
            totalLiabilities,
            netWorth
        }
    };
}
function generateMockSalnSubmission(userId, year) {
    let status = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'draft', filingType = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 'separate';
    // Generate realistic financial data based on government salary ranges
    const baseAssets = Math.floor(Math.random() * 5000000) + 2000000; // 2M to 7M
    const baseLiabilities = Math.floor(Math.random() * 2000000) + 500000; // 500K to 2.5M
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
        userId,
        year,
        status,
        totalAssets: baseAssets.toFixed(2),
        totalLiabilities: baseLiabilities.toFixed(2),
        netWorth: (baseAssets - baseLiabilities).toFixed(2),
        submittedAt: status !== 'draft' ? new Date() : null,
        approvedBy: status === 'approved' ? "01927d4e-8b45-7f52-b123-456789abcde2" : null,
        approvedAt: status === 'approved' ? new Date() : null,
        filingType,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
function generateMockRealProperty(salnSubmissionId, description, kind, location, acquisitionYear) {
    const acquisitionCost = Math.floor(Math.random() * 3000000) + 1000000; // 1M to 4M
    const appreciationRate = 1.2 + Math.random() * 0.5; // 20% to 70% appreciation
    const assessedValue = acquisitionCost * 0.8; // Assessed at 80% of acquisition
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v7$3e$__["v7"])(),
        salnSubmissionId,
        description,
        kind,
        exactLocation: location,
        assessedValue,
        currentFairMarketValue: acquisitionCost * appreciationRate,
        acquisitionYear,
        acquisitionMode: Math.random() > 0.8 ? "Inheritance" : "Purchase",
        acquisitionCost: acquisitionCost
    };
}
const philippineCities = [
    {
        city: "Quezon City",
        province: "Metro Manila",
        zipCode: "1100"
    },
    {
        city: "Manila",
        province: "Metro Manila",
        zipCode: "1000"
    },
    {
        city: "Makati",
        province: "Metro Manila",
        zipCode: "1200"
    },
    {
        city: "Pasig",
        province: "Metro Manila",
        zipCode: "1600"
    },
    {
        city: "Taguig",
        province: "Metro Manila",
        zipCode: "1630"
    },
    {
        city: "Cebu City",
        province: "Cebu",
        zipCode: "6000"
    },
    {
        city: "Davao City",
        province: "Davao del Sur",
        zipCode: "8000"
    },
    {
        city: "Iloilo City",
        province: "Iloilo",
        zipCode: "5000"
    },
    {
        city: "Baguio City",
        province: "Benguet",
        zipCode: "2600"
    },
    {
        city: "Cagayan de Oro",
        province: "Misamis Oriental",
        zipCode: "9000"
    },
    {
        city: "Zamboanga City",
        province: "Zamboanga del Sur",
        zipCode: "7000"
    },
    {
        city: "Antipolo",
        province: "Rizal",
        zipCode: "1870"
    },
    {
        city: "Calamba",
        province: "Laguna",
        zipCode: "4027"
    },
    {
        city: "Imus",
        province: "Cavite",
        zipCode: "4103"
    },
    {
        city: "Bacoor",
        province: "Cavite",
        zipCode: "4102"
    }
];
const filipinoSurnames = [
    "dela Cruz",
    "Santos",
    "Reyes",
    "Garcia",
    "Gonzales",
    "Rodriguez",
    "Hernandez",
    "Martinez",
    "Lopez",
    "Perez",
    "Ramos",
    "Flores",
    "Rivera",
    "Torres",
    "Ramirez",
    "Cruz",
    "Morales",
    "Gutierrez",
    "Ortiz",
    "Vargas",
    "Castro",
    "Romero",
    "Jimenez",
    "Herrera",
    "Medina",
    "Aguilar",
    "Guerrero",
    "Vega",
    "Soto",
    "Mendoza",
    "Salazar",
    "Bautista",
    "Aquino",
    "Fernandez",
    "Villanueva",
    "Rosario",
    "Mercado",
    "Castillo",
    "Pascual",
    "Navarro",
    "Campos",
    "Cabrera",
    "Valdez",
    "Alvarez",
    "Diaz",
    "Moreno"
];
const filipinoGivenNames = {
    male: [
        "Juan",
        "Jose",
        "Antonio",
        "Manuel",
        "Francisco",
        "Pedro",
        "Carlos",
        "Miguel",
        "Rafael",
        "Fernando",
        "Roberto",
        "Ricardo",
        "Eduardo",
        "Luis",
        "Alejandro",
        "Diego",
        "Andres",
        "Felipe",
        "Joaquin",
        "Emilio",
        "Vicente",
        "Sergio",
        "Alberto",
        "Mario",
        "Jorge",
        "Raul",
        "Arturo",
        "Oscar",
        "Victor",
        "Cesar",
        "Ernesto"
    ],
    female: [
        "Maria",
        "Ana",
        "Carmen",
        "Rosa",
        "Elena",
        "Isabel",
        "Teresa",
        "Patricia",
        "Luz",
        "Gloria",
        "Esperanza",
        "Concepcion",
        "Dolores",
        "Francisca",
        "Remedios",
        "Josefa",
        "Soledad",
        "Pilar",
        "Mercedes",
        "Cristina",
        "Beatriz",
        "Margarita",
        "Victoria",
        "Amparo",
        "Corazon",
        "Milagros",
        "Socorro",
        "Paz",
        "Fe",
        "Caridad"
    ]
};
const mockSalnDataSummary = {
    submissions: mockSalnSubmissions.length,
    realProperties: mockSalnRealProperties.length,
    personalProperties: mockSalnPersonalProperties.length,
    liabilities: mockSalnLiabilities.length,
    businessInterests: mockSalnBusinessInterests.length,
    relativesInGov: mockSalnRelativesInGov.length,
    years: Array.from(new Set(mockSalnSubmissions.map((s)=>s.year))).sort(),
    statuses: {
        draft: mockSalnSubmissions.filter((s)=>s.status === 'draft').length,
        submitted: mockSalnSubmissions.filter((s)=>s.status === 'submitted').length,
        reviewing: mockSalnSubmissions.filter((s)=>s.status === 'reviewing').length,
        approved: mockSalnSubmissions.filter((s)=>s.status === 'approved').length,
        rejected: mockSalnSubmissions.filter((s)=>s.status === 'rejected').length
    },
    filingTypes: {
        joint: mockSalnSubmissions.filter((s)=>s.filingType === 'joint').length,
        separate: mockSalnSubmissions.filter((s)=>s.filingType === 'separate').length,
        not_applicable: mockSalnSubmissions.filter((s)=>s.filingType === 'not_applicable').length
    },
    totalNetWorth: mockSalnSubmissions.reduce((sum, s)=>sum + Number(s.netWorth || 0), 0),
    averageNetWorth: mockSalnSubmissions.reduce((sum, s)=>sum + Number(s.netWorth || 0), 0) / mockSalnSubmissions.length
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/data/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// Mock Data Exports for SmartGov PDS/SALN Compliance System
// This file centralizes all mock data for frontend development before implementing real authentication and database connections
// Authentication Mock Data
__turbopack_context__.s([
    "MockDatabase",
    ()=>MockDatabase,
    "default",
    ()=>__TURBOPACK__default__export__,
    "mockDataOverview",
    ()=>mockDataOverview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/auth.js [app-client] (ecmascript)");
// User Profiles and Organization Mock Data
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/users.js [app-client] (ecmascript)");
// PDS (Personal Data Sheet) Mock Data
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/pds.js [app-client] (ecmascript)");
// SALN (Statement of Assets, Liabilities, Net Worth) Mock Data
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/saln.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
class MockDatabase {
    // Get user's complete profile with department and position info
    static getUserWithDetails(userId) {
        const profile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfileById"])(userId);
        if (!profile) return null;
        const department = profile.departmentId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDepartmentById"])(profile.departmentId) : null;
        const position = profile.positionId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPositionById"])(profile.positionId) : null;
        const authUser = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockAuthUsers"].find((u)=>u.id === userId);
        return {
            profile,
            department,
            position,
            authUser
        };
    }
    // Get user's dashboard data
    static getUserDashboard(userId) {
        const userDetails = this.getUserWithDetails(userId);
        if (!userDetails) return null;
        const pdsSubmissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPdsSubmissionsByUserId"])(userId);
        const salnSubmissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSalnSubmissionsByUserId"])(userId);
        // Get latest submissions
        const latestPds = pdsSubmissions.filter((pds)=>pds.isLatest).sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const latestSaln = salnSubmissions.sort((a, b)=>b.year - a.year)[0];
        return {
            user: userDetails,
            pds: {
                submissions: pdsSubmissions,
                latest: latestPds,
                complete: latestPds ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCompletePdsSubmission"])(latestPds.id) : null
            },
            saln: {
                submissions: salnSubmissions,
                latest: latestSaln,
                complete: latestSaln ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCompleteSalnSubmission"])(latestSaln.id) : null
            }
        };
    }
    // Get submissions requiring approval (for HR/Admin/Supervisor roles)
    static getPendingApprovals(approverId) {
        const pendingPds = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsSubmissions"].filter((pds)=>pds.status === 'submitted' || pds.status === 'reviewing');
        const pendingSaln = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnSubmissions"].filter((saln)=>saln.status === 'submitted' || saln.status === 'reviewing');
        return {
            pds: pendingPds.map((pds)=>({
                    submission: pds,
                    user: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfileById"])(pds.userId),
                    complete: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCompletePdsSubmission"])(pds.id)
                })),
            saln: pendingSaln.map((saln)=>({
                    submission: saln,
                    user: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfileById"])(saln.userId),
                    complete: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCompleteSalnSubmission"])(saln.id)
                }))
        };
    }
    // Get system statistics (for Admin dashboard)
    static getSystemStats() {
        return {
            users: {
                total: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockProfiles"].length,
                active: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockProfiles"].filter((p)=>p.isActive).length,
                byRole: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockDataSummary"].roles
            },
            pds: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsDataSummary"],
            saln: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnDataSummary"],
            departments: {
                total: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockDepartments"].length,
                active: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockDepartments"].filter((d)=>d.isActive).length
            },
            positions: {
                total: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPositions"].length,
                active: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPositions"].filter((p)=>p.isActive).length
            }
        };
    }
    // Search functionality
    static searchUsers(query) {
        const lowercaseQuery = query.toLowerCase();
        return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockProfiles"].filter((profile)=>profile.firstName.toLowerCase().includes(lowercaseQuery) || profile.lastName.toLowerCase().includes(lowercaseQuery) || profile.employeeId.toLowerCase().includes(lowercaseQuery) || profile.middleName && profile.middleName.toLowerCase().includes(lowercaseQuery)).map((profile)=>({
                profile,
                department: profile.departmentId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDepartmentById"])(profile.departmentId) : null,
                position: profile.positionId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPositionById"])(profile.positionId) : null
            }));
    }
    // Generate sample notification data
    static getNotifications(userId) {
        const notifications = [];
        const userProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfileById"])(userId);
        if (!userProfile) return [];
        // Check for pending submissions
        const userPds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPdsSubmissionsByUserId"])(userId);
        const userSaln = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSalnSubmissionsByUserId"])(userId);
        const draftPds = userPds.filter((pds)=>pds.status === 'draft');
        const draftSaln = userSaln.filter((saln)=>saln.status === 'draft');
        if (draftPds.length > 0) {
            notifications.push({
                id: "pds-draft-".concat(userId),
                type: 'deadline_reminder',
                title: 'Complete Your PDS',
                message: "You have ".concat(draftPds.length, " draft PDS submission(s). Please complete and submit before the deadline."),
                isRead: false,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            });
        }
        if (draftSaln.length > 0) {
            notifications.push({
                id: "saln-draft-".concat(userId),
                type: 'deadline_reminder',
                title: 'Complete Your SALN',
                message: "You have ".concat(draftSaln.length, " draft SALN submission(s) for ").concat(new Date().getFullYear(), ". Please complete and submit before April 30."),
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            });
        }
        // Add approval notifications for supervisors/HR/admins
        if ([
            'hr',
            'admin',
            'supervisor'
        ].includes(userProfile.role)) {
            const pendingApprovals = this.getPendingApprovals();
            const totalPending = pendingApprovals.pds.length + pendingApprovals.saln.length;
            if (totalPending > 0) {
                notifications.push({
                    id: "pending-approvals-".concat(userId),
                    type: 'approval_required',
                    title: 'Pending Approvals',
                    message: "You have ".concat(totalPending, " submission(s) requiring your review and approval."),
                    isRead: false,
                    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
                });
            }
        }
        return notifications.sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
// Authentication
MockDatabase.auth = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MockAuth"];
MockDatabase.authUsers = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockAuthUsers"];
// Organization Data
MockDatabase.departments = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockDepartments"];
MockDatabase.positions = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPositions"];
MockDatabase.profiles = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockProfiles"];
// PDS Data
MockDatabase.pdsSubmissions = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsSubmissions"];
MockDatabase.pdsPersonalInfo = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsPersonalInfo"];
MockDatabase.pdsFamilyBackground = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsFamilyBackground"];
MockDatabase.pdsChildren = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsChildren"];
MockDatabase.pdsEducation = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsEducation"];
MockDatabase.pdsCivilService = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsCivilService"];
MockDatabase.pdsWorkExperience = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsWorkExperience"];
MockDatabase.pdsVoluntaryWork = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsVoluntaryWork"];
MockDatabase.pdsTraining = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsTraining"];
MockDatabase.pdsOtherInfo = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsOtherInfo"];
// SALN Data
MockDatabase.salnSubmissions = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnSubmissions"];
MockDatabase.salnRealProperties = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnRealProperties"];
MockDatabase.salnPersonalProperties = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnPersonalProperties"];
MockDatabase.salnLiabilities = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnLiabilities"];
MockDatabase.salnBusinessInterests = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnBusinessInterests"];
MockDatabase.salnRelativesInGov = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnRelativesInGov"];
// Helper Methods for Users and Organizations
MockDatabase.getDepartment = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDepartmentById"];
MockDatabase.getPosition = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPositionById"];
MockDatabase.getProfile = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfileById"];
MockDatabase.getProfilesByDepartment = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfilesByDepartment"];
MockDatabase.getProfilesByRole = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfilesByRole"];
// Helper Methods for PDS
MockDatabase.getCompletePds = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCompletePdsSubmission"];
MockDatabase.getPdsByUser = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPdsSubmissionsByUserId"];
// Helper Methods for SALN
MockDatabase.getCompleteSaln = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCompleteSalnSubmission"];
MockDatabase.getSalnByUser = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSalnSubmissionsByUserId"];
MockDatabase.getSalnByYear = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSalnSubmissionsByYear"];
const __TURBOPACK__default__export__ = MockDatabase;
const mockDataOverview = {
    description: 'Comprehensive mock data for Philippine Government PDS/SALN Compliance System',
    created: new Date().toISOString(),
    version: '1.0.0',
    coverage: {
        authUsers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockAuthUsers"].length,
        departments: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockDepartments"].length,
        positions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPositions"].length,
        profiles: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockProfiles"].length,
        pdsSubmissions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$pds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockPdsSubmissions"].length,
        salnSubmissions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$saln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockSalnSubmissions"].length
    },
    features: [
        'Complete authentication system with mock users',
        'Realistic Filipino government employee profiles',
        'Comprehensive PDS submissions with all sections',
        'Detailed SALN submissions with financial data',
        'Multiple submission statuses and workflows',
        'Proper relationship mapping between entities',
        'Helper functions for easy data access',
        'Dashboard and notification generation',
        'Search and filtering capabilities'
    ],
    usage: {
        authentication: 'Use MockAuth class for login/logout simulation',
        users: 'Access mockProfiles for user data, use helper functions for relationships',
        pds: 'Use getCompletePdsSubmission() for full PDS data with all sections',
        saln: 'Use getCompleteSalnSubmission() for full SALN data with calculations',
        dashboard: 'Use MockDatabase.getUserDashboard() for complete user overview',
        admin: 'Use MockDatabase.getSystemStats() for administrative statistics'
    },
    notes: [
        'All IDs use UUID v7 format for realistic database compatibility',
        'Dates are properly formatted Date objects',
        'Financial amounts are in Philippine Peso (PHP)',
        'Addresses use real Philippine cities and provinces',
        'Names are culturally appropriate Filipino names',
        'Government agencies and positions are authentic',
        'Salary grades follow actual Philippine government scale'
    ]
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/hooks/useProfile.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProfile",
    ()=>useProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/index.js [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useProfile(userId) {
    _s();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [department, setDepartment] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfile.useCallback[fetchProfile]": ()=>{
            setLoading(true);
            setError(null);
            try {
                // Simulate API delay
                setTimeout({
                    "useProfile.useCallback[fetchProfile]": ()=>{
                        const userDetails = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getUserWithDetails(userId);
                        if (userDetails) {
                            setProfile(userDetails.profile);
                            setDepartment(userDetails.department || null);
                            setPosition(userDetails.position || null);
                        } else {
                            setError('Profile not found');
                        }
                        setLoading(false);
                    }
                }["useProfile.useCallback[fetchProfile]"], 300);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch profile');
                setLoading(false);
            }
        }
    }["useProfile.useCallback[fetchProfile]"], [
        userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfile.useEffect": ()=>{
            if (userId) {
                fetchProfile();
            }
        }
    }["useProfile.useEffect"], [
        userId,
        fetchProfile
    ]);
    return {
        profile,
        department,
        position,
        loading,
        error,
        refetch: fetchProfile
    };
}
_s(useProfile, "BAaWr+I1XODMlRUvsmFlNs9ltrU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/hooks/usePds.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePds",
    ()=>usePds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/utils/storage.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function usePds(userId) {
    _s();
    const [submissions, setSubmissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [latest, setLatest] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchSubmissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePds.useCallback[fetchSubmissions]": ()=>{
            setLoading(true);
            setError(null);
            try {
                // Simulate API delay
                setTimeout({
                    "usePds.useCallback[fetchSubmissions]": ()=>{
                        const userSubmissions = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getPdsByUser(userId);
                        setSubmissions(userSubmissions);
                        const latestSubmission = userSubmissions.filter({
                            "usePds.useCallback[fetchSubmissions]": (pds)=>pds.isLatest
                        }["usePds.useCallback[fetchSubmissions]"]).sort({
                            "usePds.useCallback[fetchSubmissions]": (a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        }["usePds.useCallback[fetchSubmissions]"])[0] || null;
                        setLatest(latestSubmission);
                        setLoading(false);
                    }
                }["usePds.useCallback[fetchSubmissions]"], 300);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch PDS submissions');
                setLoading(false);
            }
        }
    }["usePds.useCallback[fetchSubmissions]"], [
        userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePds.useEffect": ()=>{
            if (userId) {
                fetchSubmissions();
            }
        }
    }["usePds.useEffect"], [
        userId,
        fetchSubmissions
    ]);
    const getCompleteSubmission = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePds.useCallback[getCompleteSubmission]": (id)=>{
            const result = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getCompletePds(id);
            return result;
        }
    }["usePds.useCallback[getCompleteSubmission]"], []);
    const createDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePds.useCallback[createDraft]": async ()=>{
            // Simulate API call
            await new Promise({
                "usePds.useCallback[createDraft]": (resolve)=>setTimeout(resolve, 500)
            }["usePds.useCallback[createDraft]"]);
            const newSubmission = {
                id: "pds-".concat(Date.now()),
                userId,
                version: 1,
                status: 'draft',
                submittedAt: null,
                approvedBy: null,
                approvedAt: null,
                isLatest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Store in localStorage
            const key = "pds_draft_".concat(newSubmission.id);
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(key, newSubmission);
            fetchSubmissions();
            return newSubmission;
        }
    }["usePds.useCallback[createDraft]"], [
        userId,
        fetchSubmissions
    ]);
    const updateSubmission = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePds.useCallback[updateSubmission]": async (id, data)=>{
            // Simulate API call
            await new Promise({
                "usePds.useCallback[updateSubmission]": (resolve)=>setTimeout(resolve, 500)
            }["usePds.useCallback[updateSubmission]"]);
            const key = "pds_draft_".concat(id);
            const existing = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].get(key) || {};
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(key, {
                ...existing,
                ...data
            });
            fetchSubmissions();
            return true;
        }
    }["usePds.useCallback[updateSubmission]"], [
        fetchSubmissions
    ]);
    const submitForReview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePds.useCallback[submitForReview]": async (id)=>{
            // Simulate API call
            await new Promise({
                "usePds.useCallback[submitForReview]": (resolve)=>setTimeout(resolve, 500)
            }["usePds.useCallback[submitForReview]"]);
            const submission = submissions.find({
                "usePds.useCallback[submitForReview].submission": (s)=>s.id === id
            }["usePds.useCallback[submitForReview].submission"]);
            if (!submission) return false;
            const updated = {
                ...submission,
                status: 'submitted',
                submittedAt: new Date(),
                updatedAt: new Date()
            };
            const key = "pds_draft_".concat(id);
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(key, updated);
            fetchSubmissions();
            return true;
        }
    }["usePds.useCallback[submitForReview]"], [
        submissions,
        fetchSubmissions
    ]);
    return {
        submissions,
        latest,
        loading,
        error,
        getCompleteSubmission,
        createDraft,
        updateSubmission,
        submitForReview,
        refetch: fetchSubmissions
    };
}
_s(usePds, "aBdmp5KmNgYwo0BZBOX/ZsDl9gU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/hooks/useSaln.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSaln",
    ()=>useSaln
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/utils/storage.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function useSaln(userId) {
    _s();
    const [submissions, setSubmissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [latest, setLatest] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchSubmissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaln.useCallback[fetchSubmissions]": ()=>{
            setLoading(true);
            setError(null);
            try {
                // Simulate API delay
                setTimeout({
                    "useSaln.useCallback[fetchSubmissions]": ()=>{
                        const userSubmissions = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getSalnByUser(userId);
                        setSubmissions(userSubmissions);
                        const latestSubmission = userSubmissions.sort({
                            "useSaln.useCallback[fetchSubmissions]": (a, b)=>b.year - a.year
                        }["useSaln.useCallback[fetchSubmissions]"])[0] || null;
                        setLatest(latestSubmission);
                        setLoading(false);
                    }
                }["useSaln.useCallback[fetchSubmissions]"], 300);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch SALN submissions');
                setLoading(false);
            }
        }
    }["useSaln.useCallback[fetchSubmissions]"], [
        userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSaln.useEffect": ()=>{
            if (userId) {
                fetchSubmissions();
            }
        }
    }["useSaln.useEffect"], [
        userId,
        fetchSubmissions
    ]);
    const getCompleteSubmission = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaln.useCallback[getCompleteSubmission]": (id)=>{
            const result = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getCompleteSaln(id);
            return result;
        }
    }["useSaln.useCallback[getCompleteSubmission]"], []);
    const createDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaln.useCallback[createDraft]": async (year)=>{
            // Simulate API call
            await new Promise({
                "useSaln.useCallback[createDraft]": (resolve)=>setTimeout(resolve, 500)
            }["useSaln.useCallback[createDraft]"]);
            const newSubmission = {
                id: "saln-".concat(Date.now()),
                userId,
                year,
                status: 'draft',
                totalAssets: '0',
                totalLiabilities: '0',
                netWorth: '0',
                submittedAt: null,
                approvedBy: null,
                approvedAt: null,
                filingType: 'separate',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Store in localStorage
            const key = "saln_draft_".concat(newSubmission.id);
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(key, newSubmission);
            fetchSubmissions();
            return newSubmission;
        }
    }["useSaln.useCallback[createDraft]"], [
        userId,
        fetchSubmissions
    ]);
    const updateSubmission = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaln.useCallback[updateSubmission]": async (id, data)=>{
            var _existing_submission, _existing_submission1;
            // Simulate API call
            await new Promise({
                "useSaln.useCallback[updateSubmission]": (resolve)=>setTimeout(resolve, 500)
            }["useSaln.useCallback[updateSubmission]"]);
            const key = "saln_draft_".concat(id);
            const existing = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].get(key) || {};
            // Calculate totals if properties/liabilities are updated
            let totalAssets = Number(((_existing_submission = existing.submission) === null || _existing_submission === void 0 ? void 0 : _existing_submission.totalAssets) || '0');
            let totalLiabilities = Number(((_existing_submission1 = existing.submission) === null || _existing_submission1 === void 0 ? void 0 : _existing_submission1.totalLiabilities) || '0');
            if (data.realProperties) {
                const realPropertiesTotal = data.realProperties.reduce({
                    "useSaln.useCallback[updateSubmission].realPropertiesTotal": (sum, prop)=>sum + Number(prop.currentFairMarketValue || 0)
                }["useSaln.useCallback[updateSubmission].realPropertiesTotal"], 0);
                totalAssets += realPropertiesTotal;
            }
            if (data.personalProperties) {
                const personalPropertiesTotal = data.personalProperties.reduce({
                    "useSaln.useCallback[updateSubmission].personalPropertiesTotal": (sum, prop)=>sum + Number(prop.acquisitionCost || 0)
                }["useSaln.useCallback[updateSubmission].personalPropertiesTotal"], 0);
                totalAssets += personalPropertiesTotal;
            }
            if (data.liabilities) {
                totalLiabilities = data.liabilities.reduce({
                    "useSaln.useCallback[updateSubmission]": (sum, liability)=>sum + Number(liability.outstandingBalance || 0)
                }["useSaln.useCallback[updateSubmission]"], 0);
            }
            const netWorth = totalAssets - totalLiabilities;
            const updated = {
                ...existing,
                ...data,
                submission: {
                    ...existing.submission,
                    ...data.submission,
                    totalAssets: totalAssets.toFixed(2),
                    totalLiabilities: totalLiabilities.toFixed(2),
                    netWorth: netWorth.toFixed(2)
                }
            };
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(key, updated);
            fetchSubmissions();
            return true;
        }
    }["useSaln.useCallback[updateSubmission]"], [
        fetchSubmissions
    ]);
    const submitForReview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaln.useCallback[submitForReview]": async (id)=>{
            // Simulate API call
            await new Promise({
                "useSaln.useCallback[submitForReview]": (resolve)=>setTimeout(resolve, 500)
            }["useSaln.useCallback[submitForReview]"]);
            const submission = submissions.find({
                "useSaln.useCallback[submitForReview].submission": (s)=>s.id === id
            }["useSaln.useCallback[submitForReview].submission"]);
            if (!submission) return false;
            const updated = {
                ...submission,
                status: 'submitted',
                submittedAt: new Date(),
                updatedAt: new Date()
            };
            const key = "saln_draft_".concat(id);
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$utils$2f$storage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(key, updated);
            fetchSubmissions();
            return true;
        }
    }["useSaln.useCallback[submitForReview]"], [
        submissions,
        fetchSubmissions
    ]);
    return {
        submissions,
        latest,
        loading,
        error,
        getCompleteSubmission,
        createDraft,
        updateSubmission,
        submitForReview,
        refetch: fetchSubmissions
    };
}
_s(useSaln, "aBdmp5KmNgYwo0BZBOX/ZsDl9gU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/hooks/useDashboard.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDashboard",
    ()=>useDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/index.js [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useDashboard(userId) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchDashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[fetchDashboard]": ()=>{
            setLoading(true);
            setError(null);
            try {
                // Simulate API delay
                setTimeout({
                    "useDashboard.useCallback[fetchDashboard]": ()=>{
                        const dashboardData = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getUserDashboard(userId);
                        if (dashboardData) {
                            setData({
                                user: dashboardData.user,
                                pds: dashboardData.pds,
                                saln: dashboardData.saln,
                                notifications: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"].getNotifications(userId)
                            });
                        } else {
                            setError('Dashboard data not found');
                        }
                        setLoading(false);
                    }
                }["useDashboard.useCallback[fetchDashboard]"], 500);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
                setLoading(false);
            }
        }
    }["useDashboard.useCallback[fetchDashboard]"], [
        userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useDashboard.useEffect": ()=>{
            if (userId) {
                fetchDashboard();
            }
        }
    }["useDashboard.useEffect"], [
        userId,
        fetchDashboard
    ]);
    return {
        data,
        loading,
        error,
        refetch: fetchDashboard
    };
}
_s(useDashboard, "VlC8kVX/UZNOCH0XNlWvpEJy9IE=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/hooks/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useAuth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/useAuth.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useProfile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/useProfile.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$usePds$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/usePds.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useSaln$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/useSaln.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useDashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/useDashboard.js [app-client] (ecmascript)");
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/api/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/index.js [app-client] (ecmascript) <locals>");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button(param) {
    let { className, variant, size, asChild = false, ...props } = param;
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/button.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/ui/navigation-menu.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NavigationMenu",
    ()=>NavigationMenu,
    "NavigationMenuContent",
    ()=>NavigationMenuContent,
    "NavigationMenuIndicator",
    ()=>NavigationMenuIndicator,
    "NavigationMenuItem",
    ()=>NavigationMenuItem,
    "NavigationMenuLink",
    ()=>NavigationMenuLink,
    "NavigationMenuList",
    ()=>NavigationMenuList,
    "NavigationMenuTrigger",
    ()=>NavigationMenuTrigger,
    "NavigationMenuViewport",
    ()=>NavigationMenuViewport,
    "navigationMenuTriggerStyle",
    ()=>navigationMenuTriggerStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-navigation-menu/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDownIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDownIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
function NavigationMenu(param) {
    let { className, children, viewport = true, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "navigation-menu",
        "data-viewport": viewport,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className),
        ...props,
        children: [
            children,
            viewport && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavigationMenuViewport, {}, void 0, false, {
                fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
                lineNumber: 27,
                columnNumber: 20
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_c = NavigationMenu;
function NavigationMenuList(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["List"], {
        "data-slot": "navigation-menu-list",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("group flex flex-1 list-none items-center justify-center gap-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_c1 = NavigationMenuList;
function NavigationMenuItem(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Item"], {
        "data-slot": "navigation-menu-item",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
_c2 = NavigationMenuItem;
const navigationMenuTriggerStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1");
function NavigationMenuTrigger(param) {
    let { className, children, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "navigation-menu-trigger",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(navigationMenuTriggerStyle(), "group", className),
        ...props,
        children: [
            children,
            " ",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDownIcon$3e$__["ChevronDownIcon"], {
                className: "relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_c3 = NavigationMenuTrigger;
function NavigationMenuContent(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
        "data-slot": "navigation-menu-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto", "group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
_c4 = NavigationMenuContent;
function NavigationMenuViewport(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("absolute top-full left-0 isolate z-50 flex justify-center"),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"], {
            "data-slot": "navigation-menu-viewport",
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]", className),
            ...props
        }, void 0, false, {
            fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
            lineNumber: 112,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_c5 = NavigationMenuViewport;
function NavigationMenuLink(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
        "data-slot": "navigation-menu-link",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 129,
        columnNumber: 5
    }, this);
}
_c6 = NavigationMenuLink;
function NavigationMenuIndicator(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$navigation$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Indicator"], {
        "data-slot": "navigation-menu-indicator",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden", className),
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md"
        }, void 0, false, {
            fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
            lineNumber: 153,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/navigation-menu.tsx",
        lineNumber: 145,
        columnNumber: 5
    }, this);
}
_c7 = NavigationMenuIndicator;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7;
__turbopack_context__.k.register(_c, "NavigationMenu");
__turbopack_context__.k.register(_c1, "NavigationMenuList");
__turbopack_context__.k.register(_c2, "NavigationMenuItem");
__turbopack_context__.k.register(_c3, "NavigationMenuTrigger");
__turbopack_context__.k.register(_c4, "NavigationMenuContent");
__turbopack_context__.k.register(_c5, "NavigationMenuViewport");
__turbopack_context__.k.register(_c6, "NavigationMenuLink");
__turbopack_context__.k.register(_c7, "NavigationMenuIndicator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/ui/sheet.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sheet",
    ()=>Sheet,
    "SheetClose",
    ()=>SheetClose,
    "SheetContent",
    ()=>SheetContent,
    "SheetDescription",
    ()=>SheetDescription,
    "SheetFooter",
    ()=>SheetFooter,
    "SheetHeader",
    ()=>SheetHeader,
    "SheetTitle",
    ()=>SheetTitle,
    "SheetTrigger",
    ()=>SheetTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as XIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
function Sheet(param) {
    let { ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "sheet",
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 10,
        columnNumber: 10
    }, this);
}
_c = Sheet;
function SheetTrigger(param) {
    let { ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "sheet-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 16,
        columnNumber: 10
    }, this);
}
_c1 = SheetTrigger;
function SheetClose(param) {
    let { ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        "data-slot": "sheet-close",
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 22,
        columnNumber: 10
    }, this);
}
_c2 = SheetClose;
function SheetPortal(param) {
    let { ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"], {
        "data-slot": "sheet-portal",
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 28,
        columnNumber: 10
    }, this);
}
_c3 = SheetPortal;
function SheetOverlay(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Overlay"], {
        "data-slot": "sheet-overlay",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c4 = SheetOverlay;
function SheetContent(param) {
    let { className, children, side = "right", ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetOverlay, {}, void 0, false, {
                fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
                "data-slot": "sheet-content",
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500", side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm", side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm", side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b", side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t", className),
                ...props,
                children: [
                    children,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
                        className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__["XIcon"], {
                                className: "size-4"
                            }, void 0, false, {
                                fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_c5 = SheetContent;
function SheetHeader(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "sheet-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-1.5 p-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_c6 = SheetHeader;
function SheetFooter(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "sheet-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mt-auto flex flex-col gap-2 p-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
_c7 = SheetFooter;
function SheetTitle(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        "data-slot": "sheet-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-foreground font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
_c8 = SheetTitle;
function SheetDescription(param) {
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        "data-slot": "sheet-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/ui/sheet.tsx",
        lineNumber: 122,
        columnNumber: 5
    }, this);
}
_c9 = SheetDescription;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "Sheet");
__turbopack_context__.k.register(_c1, "SheetTrigger");
__turbopack_context__.k.register(_c2, "SheetClose");
__turbopack_context__.k.register(_c3, "SheetPortal");
__turbopack_context__.k.register(_c4, "SheetOverlay");
__turbopack_context__.k.register(_c5, "SheetContent");
__turbopack_context__.k.register(_c6, "SheetHeader");
__turbopack_context__.k.register(_c7, "SheetFooter");
__turbopack_context__.k.register(_c8, "SheetTitle");
__turbopack_context__.k.register(_c9, "SheetDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/navigation/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useAuth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/api/hooks/useAuth.js [app-client] (ecmascript)");
// UI Components
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/components/ui/navigation-menu.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/components/ui/sheet.tsx [app-client] (ecmascript)");
// Theme Components
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$theme$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/components/theme/ThemeToggle.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
;
;
// Navigation configuration
const navigationItems = [
    {
        name: 'Home',
        href: '/'
    },
    {
        name: 'Features',
        href: '#features',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"],
        description: 'Explore our government compliance features',
        items: [
            {
                name: 'e-PDS System',
                href: '/features/pds',
                description: 'Digital Personal Data Sheet management',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
            },
            {
                name: 'e-SALN System',
                href: '/features/saln',
                description: 'Statement of Assets, Liabilities, and Net Worth',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"]
            },
            {
                name: 'AI Assistant',
                href: '/features/ai-compliance',
                description: 'Get help with compliance questions',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"]
            }
        ]
    },
    {
        name: 'About',
        href: '/about'
    }
];
// Smooth scroll handler with router awareness
const handleNavClick = (e, href, pathname, router)=>{
    // For hash links (like #features), handle scroll only if on homepage
    if (href.startsWith('#')) {
        if (pathname === '/') {
            // Already on homepage, just scroll
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        } else {
            // Navigate to homepage first, then scroll
            e.preventDefault();
            if (router) {
                router.push('/' + href);
            } else {
                window.location.href = '/' + href;
            }
        }
    }
// For regular links, let Next.js Link component handle navigation
};
// Mobile Navigation Component
const MobileNavigation = (param)=>{
    let { isOpen, onClose, user, onLogout } = param;
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sheet"], {
        open: isOpen,
        onOpenChange: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetContent"], {
            side: "right",
            className: "w-80 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetHeader"], {
                    className: "text-left pb-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetTitle"], {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                className: "h-6 w-6 text-primary"
                            }, void 0, false, {
                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-government font-bold",
                                children: "SmartGov"
                            }, void 0, false, {
                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                    lineNumber: 128,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "flex flex-col gap-2 flex-1 px-1",
                    children: navigationItems.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2 animate-fade-in",
                            style: {
                                animationDelay: "".concat(index * 100, "ms")
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: item.href,
                                    onClick: (e)=>{
                                        handleNavClick(e, item.href, pathname, router);
                                        onClose();
                                    },
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('group flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all duration-300', 'hover:bg-primary/10 hover:text-primary hover:shadow-sm', 'focus-government relative overflow-hidden', 'border border-transparent hover:border-primary/20', 'transform hover:scale-[1.01] active:scale-[0.99]', pathname === item.href ? 'bg-primary/15 text-primary border-primary/30 shadow-sm' : 'text-foreground/80 hover:text-foreground'),
                                    children: [
                                        item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                            className: "h-4 w-4 transition-colors"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 158,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        item.name,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 161,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                item.items && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "ml-6 space-y-2 border-l border-border/30 pl-4",
                                    children: item.items.map((subItem)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: subItem.href,
                                            onClick: onClose,
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-start gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200', 'hover:bg-primary/8 hover:text-primary', 'focus-government', pathname === subItem.href ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground'),
                                            children: [
                                                subItem.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(subItem.icon, {
                                                    className: "h-3 w-3 mt-0.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "font-medium",
                                                            children: subItem.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                            lineNumber: 183,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-muted-foreground text-xs leading-tight mt-1",
                                                            children: subItem.description
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                            lineNumber: 184,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 182,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, subItem.name, true, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 167,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 165,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, item.name, true, {
                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                            lineNumber: 137,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                    lineNumber: 135,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-auto pt-6 border-t border-border/30",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3 px-1",
                        children: user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-4 py-3 rounded-xl bg-primary/5 border border-primary/20",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                    className: "h-5 w-5 text-primary"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 203,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 202,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm font-medium truncate",
                                                        children: user.email
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                        lineNumber: 206,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-muted-foreground",
                                                        children: "Signed in"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                        lineNumber: 207,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 205,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                        lineNumber: 201,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 200,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    onClick: ()=>{
                                        onLogout();
                                        onClose();
                                    },
                                    className: "btn-government-ghost w-full justify-center h-12 text-base font-medium",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                            className: "h-4 w-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 218,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        "Sign Out"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 211,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    asChild: true,
                                    variant: "ghost",
                                    className: "btn-government-ghost w-full justify-center h-12 text-base font-medium",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/auth/login",
                                        children: "Sign In"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                        lineNumber: 228,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 224,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    asChild: true,
                                    variant: "default",
                                    className: "btn-government w-full justify-center h-12 text-base font-medium shadow-lg",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/auth/register",
                                        children: "Get Started"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                        lineNumber: 234,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 230,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-muted-foreground text-center mt-2 px-4",
                                    children: "Secure government employee portal"
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 236,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                        lineNumber: 197,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                    lineNumber: 196,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
            lineNumber: 125,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(MobileNavigation, "0h+B63IiVHeDT9bDhB3JTwv8ebY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = MobileNavigation;
// Desktop Navigation Component
const DesktopNavigation = ()=>{
    _s1();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenu"], {
        className: "hidden lg:flex",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuList"], {
            className: "gap-1",
            children: navigationItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuItem"], {
                    children: item.items ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuTrigger"], {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-9 px-4 py-2 rounded-full transition-all duration-300', 'hover:bg-primary/10 hover:text-primary hover:shadow-md', 'data-[state=open]:bg-primary/10 data-[state=open]:text-primary', 'focus-government text-sm font-medium', 'border border-transparent hover:border-primary/20', 'transform hover:scale-105 active:scale-95'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 270,
                                            columnNumber: 35
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        item.name
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 269,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                lineNumber: 260,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuContent"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid gap-3 p-6 w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "row-span-3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuLink"], {
                                                asChild: true,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: item.href,
                                                    onClick: (e)=>handleNavClick(e, item.href, pathname, router),
                                                    className: "flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-government-soft p-6 no-underline outline-none focus:shadow-md hover:shadow-lg transition-all duration-300",
                                                    children: [
                                                        item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                            className: "h-6 w-6 text-government"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                            lineNumber: 283,
                                                            columnNumber: 29
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mb-2 mt-4 text-lg font-medium text-government",
                                                            children: item.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 27
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm leading-tight text-muted-foreground",
                                                            children: item.description
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                            lineNumber: 288,
                                                            columnNumber: 27
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 278,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 277,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 276,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid gap-2",
                                            children: item.items.map((subItem)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuLink"], {
                                                    asChild: true,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                        href: subItem.href,
                                                        className: "group grid h-auto w-full items-center justify-start gap-1 rounded-xl bg-background/50 hover:bg-primary/5 p-4 text-sm no-underline outline-none transition-all duration-300 border border-transparent hover:border-primary/20",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    subItem.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(subItem.icon, {
                                                                        className: "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                                        lineNumber: 302,
                                                                        columnNumber: 33
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-sm font-medium leading-none group-hover:text-primary transition-colors",
                                                                        children: subItem.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                                        lineNumber: 304,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                                lineNumber: 300,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "line-clamp-2 text-xs leading-snug text-muted-foreground",
                                                                children: subItem.description
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                                lineNumber: 308,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                        lineNumber: 297,
                                                        columnNumber: 27
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, subItem.name, false, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 296,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)))
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 294,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 275,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                lineNumber: 274,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuLink"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: item.href,
                            onClick: (e)=>handleNavClick(e, item.href, pathname, router),
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium', 'transition-all duration-300 focus-government', 'hover:bg-primary/10 hover:text-primary hover:shadow-md', 'border border-transparent hover:border-primary/20', 'transform hover:scale-105 active:scale-95', pathname === item.href ? 'bg-primary/15 text-primary shadow-sm border-primary/30' : 'text-muted-foreground hover:text-foreground'),
                            children: [
                                item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 333,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                item.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                            lineNumber: 320,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                        lineNumber: 319,
                        columnNumber: 15
                    }, ("TURBOPACK compile-time value", void 0))
                }, item.name, false, {
                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                    lineNumber: 257,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)))
        }, void 0, false, {
            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
            lineNumber: 255,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
        lineNumber: 254,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(DesktopNavigation, "0h+B63IiVHeDT9bDhB3JTwv8ebY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = DesktopNavigation;
// Tablet Navigation Component (condensed version for medium screens)
const TabletNavigation = ()=>{
    _s2();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const essentialItems = navigationItems.filter((item)=>[
            'Home',
            'Features',
            'About'
        ].includes(item.name));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenu"], {
        className: "hidden md:flex lg:hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuList"], {
            className: "gap-1",
            children: essentialItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuItem"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$navigation$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NavigationMenuLink"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: item.href,
                            onClick: (e)=>handleNavClick(e, item.href, pathname, router),
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium', 'transition-all duration-300 focus-government', 'hover:bg-primary/10 hover:text-primary hover:shadow-md', 'border border-transparent hover:border-primary/20', 'transform hover:scale-105 active:scale-95', pathname === item.href ? 'bg-primary/15 text-primary shadow-sm border-primary/30' : 'text-muted-foreground hover:text-foreground'),
                            children: [
                                item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 372,
                                    columnNumber: 31
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "hidden sm:inline",
                                    children: item.name
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 373,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                            lineNumber: 359,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                        lineNumber: 358,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                }, item.name, false, {
                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                    lineNumber: 357,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)))
        }, void 0, false, {
            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
            lineNumber: 355,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
        lineNumber: 354,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s2(TabletNavigation, "0h+B63IiVHeDT9bDhB3JTwv8ebY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c2 = TabletNavigation;
const Header = ()=>{
    _s3();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isScrolled, setIsScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoaded, setIsLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { user, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useAuth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // Hide header on dashboard routes
    const shouldHideHeader = pathname.startsWith('/dashboard');
    // Handle logout with navigation
    const handleLogout = async ()=>{
        await signOut();
        // Small delay to ensure all state cleanup (localStorage removal, React state updates)
        // completes before the browser navigation starts. This prevents a race condition where
        // the page reload interrupts the async cleanup process, leaving stale user state.
        await new Promise((resolve)=>setTimeout(resolve, 50));
        // Force complete page reload to clear all state
        window.location.href = '/';
    };
    // Handle scroll effect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            const handleScroll = {
                "Header.useEffect.handleScroll": ()=>{
                    setIsScrolled(window.scrollY > 10);
                }
            }["Header.useEffect.handleScroll"];
            window.addEventListener('scroll', handleScroll, {
                passive: true
            });
            return ({
                "Header.useEffect": ()=>window.removeEventListener('scroll', handleScroll)
            })["Header.useEffect"];
        }
    }["Header.useEffect"], []);
    // Handle component mount animation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            const timer = setTimeout({
                "Header.useEffect.timer": ()=>{
                    setIsLoaded(true);
                }
            }["Header.useEffect.timer"], 100);
            return ({
                "Header.useEffect": ()=>clearTimeout(timer)
            })["Header.useEffect"];
        }
    }["Header.useEffect"], []);
    // Don't render header on dashboard pages
    if (shouldHideHeader) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-out', 'transform-gpu will-change-transform', isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between', 'px-4 py-2 mx-4', 'rounded-full border shadow-lg', 'transition-all duration-500 ease-out', 'backdrop-blur-md', // Dynamic sizing based on screen
                    'w-auto max-w-4xl min-w-[280px]', // Background and border effects
                    isScrolled ? 'bg-background/80 border-border/50 shadow-xl shadow-black/10' : 'bg-background/70 border-border/30 shadow-lg shadow-black/5', // Hover effects
                    'hover:bg-background/85 hover:border-border/60 hover:shadow-xl'),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 flex-shrink-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: user ? "/dashboard/profile" : "/",
                                className: "group flex items-center gap-2 transition-all duration-300 hover:scale-105 focus-government rounded-full p-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                                className: "h-6 w-6 sm:h-7 sm:w-7 text-primary transition-all duration-300 group-hover:rotate-12"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 460,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute inset-0 bg-primary/20 rounded-full blur-sm -z-10 transition-all duration-300 group-hover:bg-primary/30 group-hover:scale-110"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 461,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                        lineNumber: 459,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-base sm:text-lg font-bold text-government transition-all duration-300 group-hover:text-primary hidden xs:inline",
                                        children: "SmartGov"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                        lineNumber: 463,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-bold text-government transition-all duration-300 group-hover:text-primary xs:hidden",
                                        children: "SG"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                        lineNumber: 466,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                lineNumber: 456,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                            lineNumber: 455,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex justify-center mx-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DesktopNavigation, {}, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 474,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabletNavigation, {}, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 475,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                            lineNumber: 473,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 flex-shrink-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$theme$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"], {
                                    variant: "minimal",
                                    size: "sm"
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 481,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "hidden md:flex items-center gap-2",
                                    children: user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                        className: "h-3.5 w-3.5 text-primary"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                        lineNumber: 488,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs font-medium text-foreground max-w-[120px] truncate",
                                                        children: user.email
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                        lineNumber: 489,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 487,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "ghost",
                                                size: "sm",
                                                onClick: handleLogout,
                                                className: "btn-government-ghost rounded-full h-8 px-3 text-xs font-medium",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                        className: "h-3.5 w-3.5 mr-1.5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                        lineNumber: 498,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    "Sign Out"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 493,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                asChild: true,
                                                variant: "ghost",
                                                size: "sm",
                                                className: "btn-government-ghost rounded-full h-8 px-3 text-xs font-medium",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/auth/login",
                                                    children: "Sign In"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 509,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 504,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                asChild: true,
                                                size: "sm",
                                                className: "btn-government rounded-full h-8 px-3 text-xs font-medium",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/auth/register",
                                                    children: "Sign Up"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                    lineNumber: 515,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                                lineNumber: 511,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true)
                                }, void 0, false, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 484,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    size: "sm",
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('md:hidden rounded-full h-8 w-8 p-0 relative overflow-hidden', 'hover:bg-primary/10 transition-all duration-300', 'focus-government'),
                                    onClick: ()=>setIsMobileMenuOpen(true),
                                    "aria-label": "Open mobile menu",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                            className: "h-4 w-4 transition-transform duration-300 hover:scale-110"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 532,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                            lineNumber: 533,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                                    lineNumber: 522,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                            lineNumber: 479,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                    lineNumber: 438,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                lineNumber: 432,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavigation, {
                isOpen: isMobileMenuOpen,
                onClose: ()=>setIsMobileMenuOpen(false),
                user: user,
                onLogout: handleLogout
            }, void 0, false, {
                fileName: "[project]/apps/employee/src/components/navigation/Header.tsx",
                lineNumber: 540,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
_s3(Header, "gFwdgTomlSgfRY9xrmTlcMDjE9Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$api$2f$hooks$2f$useAuth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c3 = Header;
const __TURBOPACK__default__export__ = Header;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "MobileNavigation");
__turbopack_context__.k.register(_c1, "DesktopNavigation");
__turbopack_context__.k.register(_c2, "TabletNavigation");
__turbopack_context__.k.register(_c3, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/navigation/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Navigation Components
 *
 * Professional navigation components for the SmartGov government compliance system.
 * Features glass morphism design, responsive behavior, and government blue theming.
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$navigation$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/components/navigation/Header.tsx [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/employee/src/components/theme/ThemeWrapper.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeWrapper",
    ()=>ThemeWrapper,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$context$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/context/ThemeContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$navigation$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/employee/src/components/navigation/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$navigation$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/employee/src/components/navigation/Header.tsx [app-client] (ecmascript)");
'use client';
;
;
;
const ThemeWrapper = (param)=>{
    let { children } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$context$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: false,
        storageKey: "smartgov-theme",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$employee$2f$src$2f$components$2f$navigation$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Header"], {}, void 0, false, {
                fileName: "[project]/apps/employee/src/components/theme/ThemeWrapper.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/apps/employee/src/components/theme/ThemeWrapper.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = ThemeWrapper;
const __TURBOPACK__default__export__ = ThemeWrapper;
var _c;
__turbopack_context__.k.register(_c, "ThemeWrapper");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/mock-data/dist/providers/MockDataProvider.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MockDataProvider",
    ()=>MockDataProvider,
    "useMockData",
    ()=>useMockData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/mock-data/dist/data/index.js [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const MockDataContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function MockDataProvider(param) {
    let { children } = param;
    const value = {
        mockDb: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$mock$2d$data$2f$dist$2f$data$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MockDatabase"]
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(MockDataContext.Provider, {
        value: value,
        children: children
    });
}
_c = MockDataProvider;
function useMockData() {
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(MockDataContext);
    if (context === undefined) {
        throw new Error('useMockData must be used within a MockDataProvider');
    }
    return context;
}
_s(useMockData, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "MockDataProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_a2507c57._.js.map