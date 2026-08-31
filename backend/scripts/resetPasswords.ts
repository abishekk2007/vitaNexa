import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Password reset migration starting...');

  const targetPassword = 'password123';
  const hashedPassword = await bcrypt.hash(targetPassword, 12);
  console.log('Target hash generated:', hashedPassword.substring(0, 20) + '...');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, password: true },
  });
  console.log(`Found ${users.length} users in database\n`);

  let resetCount = 0;
  let skipCount = 0;

  for (const user of users) {
    const isBcrypt =
      user.password.length === 60 &&
      (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

    if (!isBcrypt) {
      console.log(`RESET [invalid hash]: ${user.email} (${user.role})`);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      resetCount++;
      continue;
    }

    const matchesExpected = await bcrypt.compare(targetPassword, user.password);
    if (matchesExpected) {
      console.log(`SKIP  [already matches]: ${user.email} (${user.role})`);
      skipCount++;
    } else {
      console.log(`RESET [hash mismatch] : ${user.email} (${user.role})`);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      resetCount++;
    }
  }

  console.log(`\nDone. Reset: ${resetCount}, Skipped: ${skipCount}, Total: ${users.length}`);

  if (resetCount > 0) {
    console.log('\nAll reset users now have password: password123');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
