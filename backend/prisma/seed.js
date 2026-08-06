// prisma/seed.js
// ============================================================
// Database seed script.
// Creates a single admin user for local development.
// Run with: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create dev admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@avenor.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@avenor.dev",
      password: await bcrypt.hash("Admin1234!", 10),
    },
  });

  console.log(`✅ User: ${adminUser.email} (id: ${adminUser.id})`);

  // Create a sample project
  await prisma.project.upsert({
    where: { slug: "avenor-demo" },
    update: {},
    create: {
      name: "Avenor Demo",
      slug: "avenor-demo",
      description: "A demo project for local development.",
      ownerId: adminUser.id,
    },
  });

  console.log("✅ Sample project created: avenor-demo");
  console.log("🎉 Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
