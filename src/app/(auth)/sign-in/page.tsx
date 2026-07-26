import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Welcome back. Sign in to your account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* SignInForm reads the `next` search param, which opts it out of
            static prerendering unless it sits behind a Suspense boundary. */}
        <Suspense fallback={<div className="h-64" />}>
          <SignInForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
