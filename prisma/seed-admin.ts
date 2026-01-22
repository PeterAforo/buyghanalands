import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPhone = "+233200000001";
  const adminEmail = "admin@buyghanalands.com";
  const adminPassword = "Admin@123456";
  const adminName = "System Administrator";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (existingAdmin) {
    // Update existing user to have admin role
    const updated = await prisma.user.update({
      where: { phone: adminPhone },
      data: {
        roles: ["ADMIN", "BUYER"],
        email: adminEmail,
        fullName: adminName,
      },
    });
    console.log("✅ Existing user updated with ADMIN role:");
    console.log(`   Phone: ${updated.phone}`);
    console.log(`   Email: ${updated.email}`);
    return;
  }

  // Create new admin user
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      phone: adminPhone,
      phoneVerified: true,
      email: adminEmail,
      emailVerified: true,
      passwordHash,
      fullName: adminName,
      roles: ["ADMIN", "BUYER"],
      kycTier: "TIER_2_GHANA_CARD",
      accountStatus: "ACTIVE",
    },
  });

  console.log("\n✅ Admin user created successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ADMIN LOGIN CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Phone:    ${adminPhone}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Email:    ${adminEmail}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("  Login at: /auth/login");
  console.log("  Admin dashboard: /admin\n");
}

main()
  .catch((e) => {
    console.error("Error creating admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
