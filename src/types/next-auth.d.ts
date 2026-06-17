import { Role } from "@/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      company?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    company?: string;
  }
}
