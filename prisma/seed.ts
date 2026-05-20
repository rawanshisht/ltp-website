import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({ where: { name: "English" }, update: {}, create: { name: "English", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "Maths" }, update: {}, create: { name: "Maths", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "Science" }, update: {}, create: { name: "Science", type: "CORE" } }),
    prisma.subject.upsert({ where: { name: "Computer Science" }, update: {}, create: { name: "Computer Science", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Electronics" }, update: {}, create: { name: "Electronics", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Mandarin" }, update: {}, create: { name: "Mandarin", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "BCS" }, update: {}, create: { name: "BCS", type: "OPTIONAL" } }),
    prisma.subject.upsert({ where: { name: "Arabic" }, update: {}, create: { name: "Arabic", type: "OPTIONAL" } }),
  ]);

  // Classes
  const classes = await Promise.all([
    prisma.class.upsert({ where: { name: "YOUNGER_BOYS" }, update: {}, create: { name: "YOUNGER_BOYS" } }),
    prisma.class.upsert({ where: { name: "OLDER_BOYS" }, update: {}, create: { name: "OLDER_BOYS" } }),
    prisma.class.upsert({ where: { name: "GIRLS" }, update: {}, create: { name: "GIRLS" } }),
  ]);

  // Admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@ltpcentre.com" },
    update: {},
    create: { firstName: "Admin", lastName: "User", email: "admin@ltpcentre.com", password: adminPassword, role: "ADMIN" },
  });

  // Sample teacher
  const teacherPassword = await bcrypt.hash("teacher123!", 12);
  await prisma.user.upsert({
    where: { email: "teacher@ltpcentre.com" },
    update: { firstName: "Fatima", lastName: "Ahmed" },
    create: {
      firstName: "Fatima",
      lastName: "Ahmed",
      email: "teacher@ltpcentre.com",
      password: teacherPassword,
      role: "TEACHER",
      teacher: {
        create: {
          teacherSubjects: {
            create: [
              { subjectId: subjects[0].id },
              { subjectId: subjects[1].id },
            ],
          },
          teacherClasses: {
            create: [{ classId: classes[2].id }],
          },
        },
      },
    },
  });

  // Sample parent + student
  const parentPassword = await bcrypt.hash("parent123!", 12);
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "parent@example.com",
      password: parentPassword,
      role: "PARENT",
      parent: { create: {} },
    },
  });

  const parent = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
  if (parent) {
    const existing = await prisma.student.findFirst({ where: { name: "Aisha Johnson" } });
    if (!existing) {
      await prisma.student.create({
        data: {
          name: "Aisha Johnson",
          classId: classes[2].id,
          studentSubjects: {
            create: [
              { subjectId: subjects[0].id },
              { subjectId: subjects[1].id },
              { subjectId: subjects[2].id },
            ],
          },
          parentStudents: { create: { parentId: parent.id } },
        },
      });
    }
  }

  console.log("✓ Seed complete");
  console.log("  admin@ltpcentre.com    / admin123!");
  console.log("  teacher@ltpcentre.com  / teacher123!");
  console.log("  parent@example.com     / parent123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
