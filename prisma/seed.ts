import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Subjects
  await Promise.all([
    prisma.subject.upsert({ where: { name: "English" }, update: {}, create: { name: "English", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "Maths" }, update: {}, create: { name: "Maths", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "Science" }, update: {}, create: { name: "Science", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "Computer Science" }, update: {}, create: { name: "Computer Science", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Electronics" }, update: {}, create: { name: "Electronics", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Mandarin" }, update: {}, create: { name: "Mandarin", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "BCS" }, update: {}, create: { name: "BCS", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Arabic" }, update: {}, create: { name: "Arabic", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Biology" }, update: {}, create: { name: "Biology", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "The Forge" }, update: {}, create: { name: "The Forge", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Misbah" }, update: {}, create: { name: "Misbah", type: "OPTIONAL" } }),

  ]);

  // Classes
  await Promise.all([
    prisma.class.upsert({ where: { name: "YOUNGER_BOYS" }, update: {}, create: { name: "YOUNGER_BOYS" } }),
    prisma.class.upsert({ where: { name: "OLDER_BOYS" }, update: {}, create: { name: "OLDER_BOYS" } }),
    prisma.class.upsert({ where: { name: "GIRLS" }, update: {}, create: { name: "GIRLS" } }),
  ]);

  // Admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  // Migrate old email if it still exists
  await prisma.user.updateMany({
    where: { email: "admin@ltpcentre.com" },
    data: { email: "admin@robocode.uk" },
  });
  await prisma.user.upsert({
    where: { email: "admin@robocode.uk" },
    update: {},
    create: { firstName: "Admin", lastName: "User", email: "admin@robocode.uk", password: adminPassword, role: "ADMIN" },
  });

  // Teacher — Sadaf Iqbal (Electronics)
  const electronics = await prisma.subject.findUnique({ where: { name: "Electronics" } });
  const sadafPassword = await bcrypt.hash("sadaf123!", 12);
  const sadafUser = await prisma.user.upsert({
    where: { email: "s.iqbal@robocode.uk" },
    update: {},
    create: { firstName: "Sadaf", lastName: "Iqbal", email: "s.iqbal@robocode.uk", password: sadafPassword, role: "TEACHER" },
  });
  const sadaf = await prisma.teacher.upsert({
    where: { userId: sadafUser.id },
    update: {},
    create: { userId: sadafUser.id },
  });
  await prisma.teacherSubject.upsert({
    where: { teacherId_subjectId: { teacherId: sadaf.id, subjectId: electronics!.id } },
    update: {},
    create: { teacherId: sadaf.id, subjectId: electronics!.id },
  });

  // Students — Older Boys, Electronics
  const olderBoys = await prisma.class.findUnique({ where: { name: "OLDER_BOYS" } });
  const studentNames = ["Imraan", "Yahya Aarif", "Yahya Muhammad", "Abdallah Parkar"];
  for (const name of studentNames) {
    const existing = await prisma.student.findFirst({ where: { name } });
    if (!existing) {
      await prisma.student.create({
        data: {
          name,
          classId: olderBoys!.id,
          studentSubjects: { create: { subjectId: electronics!.id } },
        },
      });
    }
  }

  console.log("✓ Seed complete.");
  console.log("  admin@robocode.uk     / admin123!");
  console.log("  s.iqbal@robocode.uk   / sadaf123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
