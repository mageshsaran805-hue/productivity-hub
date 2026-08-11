"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setSent(true);
      toast.success("Reset link sent!");
    }
  };

  return (
    <AuthLayout title={sent ? "Check your email" : "Reset password"} subtitle={sent ? "We've sent a reset link to your email" : "Enter your email and we'll send you a reset link"}>
      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </motion.div>
          <p className="text-sm text-foreground/50 mb-6">
            We sent a password reset link to <strong className="text-foreground/80">{email}</strong>
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>Send again</Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Link</Button>
        </form>
      )}
      <div className="mt-6 text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
