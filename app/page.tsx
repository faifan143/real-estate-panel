'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { token, role } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token && role) {
      if (role === 'ADMIN') {
        router.push('/admin/requests');
      } else {
        router.push('/properties');
      }
    }
  }, [token, role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Real Estate Panel</h1>
        <p className="text-zinc-600 mb-8">Semester Project</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
