import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm ring-1 ring-clay-900/5 sm:p-10">
        <div className="flex justify-center">
          <Image
            src="/brand/shine-logo.png"
            alt="Shine Ministries"
            width={1000}
            height={517}
            priority
            className="h-16 w-auto"
          />
        </div>
        <p className="mt-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-sage-dark">
          Office
        </p>
        <h1 className="mt-2 text-center font-display text-2xl text-clay-900">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
