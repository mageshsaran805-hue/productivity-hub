import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // ponytail: Resend-only, no fallback SMTP
      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — password reset email not sent");
        return;
      }
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Productivity Hub <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2>Reset your password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a>
          <p style="color:#888;font-size:14px;">If you didn't request this, you can ignore this email.</p>
        </div>`,
      });
    },
  },
  plugins: [nextCookies()],
});
