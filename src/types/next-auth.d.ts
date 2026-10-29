import type { Perfil } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    perfil: Perfil;
  }
  interface Session {
    user: { id: string; name: string; email: string; perfil: Perfil };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    perfil: Perfil;
  }
}
