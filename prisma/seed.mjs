import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding access codes and sample email-whitelisted participants...');

  // 1. Access Codes
  const sampleCodes = [
    'CFC-PASS-2026',
    'VIP-CMP-GDG',
    'HACK-2026-001',
    'HACK-2026-002',
    'HACK-2026-003',
    'COMMUNITY-2026',
    'GDG-PRAYAGRAJ-01',
  ];

  for (const code of sampleCodes) {
    await prisma.accessCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        status: 'ACTIVE',
      },
    });
  }

  // 2. Pre-Registered Whitelisted Participants (Email Primary Identifier)
  const samplePreRegistered = [
    {
      email: 'rahul.sharma@example.com',
      fullName: 'Rahul Sharma',
      collegeName: 'CMP Degree College',
      teamName: 'Code Warriors',
      accessCode: 'CFC-PASS-2026',
    },
    {
      email: 'priya.patel@example.com',
      fullName: 'Priya Patel',
      collegeName: 'University of Allahabad',
      teamName: 'Tech Titans',
      accessCode: 'VIP-CMP-GDG',
    },
    {
      email: 'amit.kumar@example.com',
      fullName: 'Amit Kumar',
      collegeName: 'MNNIT Allahabad',
      teamName: 'Dev Squad',
      accessCode: 'HACK-2026-001',
    },
    {
      email: 'sneha.verma@example.com',
      fullName: 'Sneha Verma',
      collegeName: 'CMP Degree College',
      teamName: 'Binary Hackers',
      accessCode: 'HACK-2026-002',
    },
    {
      email: 'vikram.singh@example.com',
      fullName: 'Vikram Singh',
      collegeName: 'IIIT Allahabad',
      teamName: 'Cyber Knights',
      accessCode: 'HACK-2026-003',
    },
  ];

  for (const item of samplePreRegistered) {
    const existing = await prisma.whitelistParticipant.findFirst({
      where: { email: item.email },
    });

    if (!existing) {
      await prisma.whitelistParticipant.create({
        data: {
          email: item.email.toLowerCase(),
          fullName: item.fullName,
          collegeName: item.collegeName,
          teamName: item.teamName,
          accessCode: item.accessCode,
          status: 'PENDING',
        },
      });
    }
  }

  console.log('Seeded email-whitelisted participants successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
