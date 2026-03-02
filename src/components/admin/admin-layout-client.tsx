"use client";

import { signOut } from "next-auth/react";
import { AdminMobileNav } from "./admin-mobile-nav";

interface AdminLayoutClientProps {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function AdminLayoutClient({ userName, userEmail, children }: AdminLayoutClientProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <>
      <AdminMobileNav 
        userName={userName} 
        userEmail={userEmail} 
        onSignOut={handleSignOut} 
      />
      {children}
    </>
  );
}
