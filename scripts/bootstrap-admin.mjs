import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set for admin bootstrap`);
  return value;
}

const email = required("ADMIN_EMAIL").toLowerCase();
const password = required("ADMIN_PASSWORD");

if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD must contain at least 12 characters");
}

try {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Never overwrite an existing password during normal container restarts.
    // The configured admin identity remains explicitly privileged.
    if (!existing.isAdmin || existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isAdmin: true, role: "ADMIN" },
      });
      console.log(`Admin privileges ensured for ${email}.`);
    } else {
      console.log(`Admin account ${email} already exists; password unchanged.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Alimenta Pro beheerder",
        isAdmin: true,
        role: "ADMIN",
      },
    });
    console.log(`Initial admin account created for ${email}.`);
  }
} finally {
  await prisma.$disconnect();
}
