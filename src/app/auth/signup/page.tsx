"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useAuth();
  const router = useRouter();

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-danger-500", "bg-warning-500", "bg-yellow-500", "bg-success-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    setIsLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Account created! Redirecting...");
      router.push("/app");
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your productivity journey today">
      <form onSubmit={handleSubmit} className="space-y-4">
        <GoogleButton />

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-foreground/40">or sign up with email</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <Input label="Full Name" placeholder="John Doe" icon={<User className="w-4 h-4" />} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-foreground/30 hover:text-foreground/60">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-foreground/10"}`} />
                ))}
              </div>
              <p className={`text-xs ${strength >= 4 ? "text-success-500" : "text-foreground/40"}`}>{strengthLabels[strength]}</p>
            </div>
          )}
        </div>
        <Button type="submit" loading={isLoading} className="w-full" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
          Create Account
        </Button>
        <p className="text-center text-sm text-foreground/50 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-medium">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
