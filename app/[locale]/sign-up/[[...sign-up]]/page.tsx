import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-50 p-6">
      <div className="mx-auto flex max-w-md justify-center pt-12">
        <SignUp path="/sign-up" />
      </div>
    </div>
  );
}

