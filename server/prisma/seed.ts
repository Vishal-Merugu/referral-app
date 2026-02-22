import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting seed...');

  // Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Vercel',
      domain: 'vercel.com',
      logoUrl:
        'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
      description: 'Develop. Preview. Ship.',
      industry: 'Technology',
      size: '501-1000',
      techStack: ['Next.js', 'React', 'TypeScript', 'Turborepo'],
      perks: ['Remote-first', 'Health Insurance', 'Home Office Stipend'],
    },
  });

  console.log('Created Company:', company.name);

  // Create Employee
  const passwordHash = await bcrypt.hash('password123', 10);
  const employee = await prisma.user.create({
    data: {
      email: 'employee@vercel.com',
      passwordHash,
      role: 'EMPLOYEE',
      firstName: 'Guillermo',
      lastName: 'Rauch',
      headline: 'CEO at Vercel',
      companyId: company.id,
      isVerified: true,
      skills: ['Leadership', 'Next.js', 'React'],
    },
  });

  console.log('Created Employee:', employee.email);

  // Add Availability for Employee (Mon-Fri 09:00 - 17:00)
  const slots = [];
  for (let d = 1; d <= 5; d++) {
    slots.push({
      userId: employee.id,
      dayOfWeek: d,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'America/Los_Angeles',
    });
  }
  await prisma.availabilitySlot.createMany({ data: slots });
  console.log('Created Availability Slots');

  // Create Referral Post
  const post = await prisma.referralPost.create({
    data: {
      employeeId: employee.id,
      jobRole: 'Senior Frontend Engineer',
      department: 'Engineering',
      experienceLevel: 'SENIOR',
      description:
        'We are looking for an expert React developer to help build the future of the web.',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      remoteType: 'REMOTE',
      salaryMin: 150000,
      salaryMax: 200000,
      referralPrice: 0,
      status: 'ACTIVE',
    },
  });

  console.log('Created Referral Post:', post.jobRole);

  // Create Seeker
  const seeker = await prisma.user.create({
    data: {
      email: 'seeker@example.com',
      passwordHash,
      role: 'SEEKER',
      firstName: 'Alice',
      lastName: 'Hacker',
      headline: 'Full-stack Developer',
      skills: ['React', 'Node.js', 'TypeScript'],
    },
  });

  console.log('Created Seeker:', seeker.email);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
