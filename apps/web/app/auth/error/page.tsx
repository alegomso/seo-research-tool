'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact your administrator.';
      case 'AccessDenied':
        return 'You do not have permission to sign in. Please contact your administrator.';
      case 'Verification':
        return 'The verification link is invalid or has expired.';
      default:
        return 'An unexpected error occurred during sign in.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              Try Again
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Go Home
            </Link>
          </Button>

          {error && (
            <div className="text-center text-xs text-gray-500">
              Error code: {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}