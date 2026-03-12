import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-50 p-6">
      <div className="mx-auto flex max-w-md justify-center pt-12">
        <SignIn path="/sign-in" />
      </div>
    </div>
  );
}

