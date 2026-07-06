import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Create your account</h1>
      <p className="mt-1.5 text-sm text-text-muted">Save repos, track issues, and view them across sessions.</p>
      <div className="mt-6"><SignupForm /></div>
      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">Log in</Link>
      </p>
    </div>
  );
}
