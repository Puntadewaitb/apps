"use client";

import { signOut } from "next-auth/react";
import { Button } from "@tpl/ui";

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
      Keluar
    </Button>
  );
}
