'use client';

import Link from "next/link";
import { Home, LayoutDashboard, ShieldAlert } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Animated Grid Pattern Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      {/* Animated Particles Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-2 w-2 rounded-full bg-primary/20 blur-sm animate-float" style={{ top: "10%", left: "15%", animationDelay: "0s" }} />
        <div className="absolute h-3 w-3 rounded-full bg-primary/15 blur-sm animate-float" style={{ top: "25%", left: "80%", animationDelay: "1s" }} />
        <div className="absolute h-2 w-2 rounded-full bg-primary/25 blur-sm animate-float" style={{ top: "60%", left: "10%", animationDelay: "2s" }} />
        <div className="absolute h-3 w-3 rounded-full bg-primary/20 blur-sm animate-float" style={{ top: "75%", left: "70%", animationDelay: "1.5s" }} />
        <div className="absolute h-2 w-2 rounded-full bg-primary/15 blur-sm animate-float" style={{ top: "40%", left: "90%", animationDelay: "0.5s" }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
        {/* TUPSAFE Logo/Title */}
        <div className="mb-12 animate-fade-in">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-6 backdrop-blur-sm">
            <ShieldAlert className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold tracking-wide text-muted-foreground">
            TUPSAFE
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/70">
            TUP Manila e-PDS and e-SALN Compliance System
          </p>
        </div>

        {/* 404 Number - Large and Prominent */}
        <div className="mb-8 animate-slide-down">
          <div className="relative inline-block">
            {/* Glow effect behind 404 */}
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />

            <h1 className="relative text-[10rem] font-bold leading-none tracking-tighter text-primary/90 sm:text-[12rem] md:text-[14rem] lg:text-[16rem]">
              404
            </h1>

            {/* Subtle accent line */}
            <div className="absolute bottom-0 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl animate-fade-in">
          Page Not Found
        </h2>

        {/* Message */}
        <p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
          Please check the URL or return to a safe location within the TUPSAFE system.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* Primary Button - Return to Home */}
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

            <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="relative">Return to Home</span>
          </Link>

          {/* Secondary Button - Go to Dashboard */}
          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-transparent px-8 py-4 text-base font-medium text-foreground transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Additional Help Text */}
        <p className="mt-12 text-sm text-muted-foreground/60 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Need assistance? Contact your department administrator or{" "}
          <Link
            href="/support"
            className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
          >
            visit our support page
          </Link>
          .
        </p>
      </div>

      {/* Additional CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.6;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
