import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ArrowLeft, UserPlus } from 'lucide-react';

export const metadata = {
  title: 'Sign Up | SmartGov - Government Compliance System',
  description: 'Create your SmartGov account - Digital compliance platform for Philippine government employees.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <ShieldCheck className="h-8 w-8 text-government" />
            <span className="text-2xl font-bold text-government">SmartGov</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Join SmartGov</h1>
          <p className="text-muted-foreground">
            Create your account to access government compliance tools
          </p>
        </div>

        {/* Not Implemented Card */}
        <Card className="p-8 text-center space-y-6 border-government/20">
          <div className="mx-auto w-16 h-16 bg-government/10 rounded-full flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-government" />
          </div>
          
          <div className="space-y-3">
            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
              Coming Soon
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              Registration System
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The account registration functionality is currently under development as part of our thesis research. 
              This will include government employee verification and secure onboarding processes.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Planned Features:</strong></p>
              <ul className="text-left space-y-1">
                <li>• Government Employee Verification</li>
                <li>• Department-based Access Control</li>
                <li>• Secure Profile Management</li>
                <li>• CSC Compliance Integration</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-government hover:bg-government/90">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Homepage
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/about">
                  Learn More About SmartGov
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            SmartGov is a thesis research project for Philippine government compliance modernization.
          </p>
          <p className="mt-2">
            Already have an account? <Link href="/auth/login" className="text-government hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}