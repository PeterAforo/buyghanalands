import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminPhone() {
  try {
    const admin = await prisma.user.update({
      where: { email: 'admin@buyghanalands.com' },
      data: { phone: '0200000000' },
    });
    
    console.log('✅ Admin phone updated!');
    console.log('');
    console.log('=================================');
    console.log('  ADMIN CREDENTIALS');
    console.log('=================================');
    console.log('  Phone:    ', admin.phone);
    console.log('  Password: ', 'Admin@BGL2026!');
    console.log('=================================');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPhone();
