/**
 * Script to create an admin user
 * Run with: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@buyghanalands.com';
  const password = 'Admin@BGL2026!';
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email:', email);
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        fullName: 'System Administrator',
        phone: '+233000000000',
        passwordHash: hashedPassword,
        roles: ['ADMIN'],
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('=================================');
    console.log('  ADMIN CREDENTIALS');
    console.log('=================================');
    console.log('  Email:    ', email);
    console.log('  Password: ', password);
    console.log('=================================');
    console.log('');
    console.log('User ID:', admin.id);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
