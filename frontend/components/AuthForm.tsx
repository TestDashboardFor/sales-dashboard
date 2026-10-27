"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Field, inputClass } from "./ui";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await (isLogin ? api.login : api.register)(username, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm !p-6">
        <h1 className="text-xl font-semibold">
          {isLogin ? "Sign in" : "Create account"}
        </h1>
        <p className="mb-5 text-sm text-stone-500">Sales Dashboard</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Username">
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              autoFocus
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              maxLength={128}
              required
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Please wait…" : isLogin ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          {isLogin ? "No account yet? " : "Already registered? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium text-blue-700 hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </Card>
    </main>
  );
}
