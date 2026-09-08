import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = new Date(`${todayStr}T00:00:00.000Z`);

  console.log(`Seeding sample overrides for date ${todayStr}...`);

  // Overrides for today:
  // Period 2: CANCELED (Faculty on medical leave)
  // Period 4: SWAPPED (Computer Networks relocated to CS Lab 3)
  await prisma.periodOverride.upsert({
    where: {
      date_periodIndex: {
        date: targetDate,
        periodIndex: 2,
      },
    },
    update: {
      status: 'CANCELED',
      note: 'Faculty on emergency leave. Self-study in library.',
    },
    create: {
      date: targetDate,
      periodIndex: 2,
      status: 'CANCELED',
      note: 'Faculty on emergency leave. Self-study in library.',
    },
  });

  await prisma.periodOverride.upsert({
    where: {
      date_periodIndex: {
        date: targetDate,
        periodIndex: 4,
      },
    },
    update: {
      status: 'SWAPPED',
      overrideSubject: 'Advanced Cloud Computing',
      overrideFaculty: 'Dr. Werner Vogels',
      overrideVenue: 'CS Lab 3',
      note: 'Special guest lecture relocated to CS Lab 3.',
    },
    create: {
      date: targetDate,
      periodIndex: 4,
      status: 'SWAPPED',
      overrideSubject: 'Advanced Cloud Computing',
      overrideFaculty: 'Dr. Werner Vogels',
      overrideVenue: 'CS Lab 3',
      note: 'Special guest lecture relocated to CS Lab 3.',
    },
  });

  console.log('Sample overrides seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
