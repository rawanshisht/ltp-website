import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}

// June assessment dates for testing
function juneDate(day: number) {
  const d = new Date();
  d.setMonth(5, day); // June
  d.setHours(10, 0, 0, 0);
  if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
  return d;
}

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

  const [english, maths, science, cs, electronics, mandarin, bcs, arabic] = subjects;

  // Classes
  const classes = await Promise.all([
    prisma.class.upsert({ where: { name: "YOUNGER_BOYS" }, update: {}, create: { name: "YOUNGER_BOYS" } }),
    prisma.class.upsert({ where: { name: "OLDER_BOYS" }, update: {}, create: { name: "OLDER_BOYS" } }),
    prisma.class.upsert({ where: { name: "GIRLS" }, update: {}, create: { name: "GIRLS" } }),
  ]);

  const [youngerBoys, olderBoys, girls] = classes;

  // Admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@ltpcentre.com" },
    update: {},
    create: { firstName: "Admin", lastName: "User", email: "admin@ltpcentre.com", password: adminPassword, role: "ADMIN" },
  });

  // Teacher 1 — Fatima Ahmed (English + Maths, Girls class)
  const teacherPassword = await bcrypt.hash("teacher123!", 12);
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "teacher@ltpcentre.com" },
    update: { firstName: "Fatima", lastName: "Ahmed" },
    create: {
      firstName: "Fatima",
      lastName: "Ahmed",
      email: "teacher@ltpcentre.com",
      password: teacherPassword,
      role: "TEACHER",
    },
  });

  let teacher1 = await prisma.teacher.findUnique({ where: { userId: teacherUser1.id } });
  if (!teacher1) {
    teacher1 = await prisma.teacher.create({
      data: {
        userId: teacherUser1.id,
        teacherSubjects: {
          create: [{ subjectId: english.id }, { subjectId: maths.id }],
        },
        teacherClasses: {
          create: [{ classId: girls.id }],
        },
      },
    });
  }

  // Teacher 2 — Omar Hassan (Science + CS, Older Boys)
  const teacher2Password = await bcrypt.hash("teacher2!", 12);
  const teacherUser2 = await prisma.user.upsert({
    where: { email: "teacher2@ltpcentre.com" },
    update: { firstName: "Omar", lastName: "Hassan" },
    create: {
      firstName: "Omar",
      lastName: "Hassan",
      email: "teacher2@ltpcentre.com",
      password: teacher2Password,
      role: "TEACHER",
    },
  });

  let teacher2 = await prisma.teacher.findUnique({ where: { userId: teacherUser2.id } });
  if (!teacher2) {
    teacher2 = await prisma.teacher.create({
      data: {
        userId: teacherUser2.id,
        teacherSubjects: {
          create: [{ subjectId: science.id }, { subjectId: cs.id }],
        },
        teacherClasses: {
          create: [{ classId: olderBoys.id }],
        },
      },
    });
  }

  // Parent 1 — Sarah Johnson (Girls class — Aisha)
  const parentPassword = await bcrypt.hash("parent123!", 12);
  const parentUser1 = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: { firstName: "Sarah", lastName: "Johnson", phone: "+44 7700 900123" },
    create: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "parent@example.com",
      password: parentPassword,
      role: "PARENT",
      phone: "+44 7700 900123",
    },
  });

  let parent1 = await prisma.parent.findUnique({ where: { userId: parentUser1.id } });
  if (!parent1) {
    parent1 = await prisma.parent.create({ data: { userId: parentUser1.id } });
  }

  // Parent 2 — Ali Al-Rashid (Older Boys — Yusuf + Ibrahim)
  const parent2Password = await bcrypt.hash("parent2!", 12);
  const parentUser2 = await prisma.user.upsert({
    where: { email: "parent2@example.com" },
    update: { firstName: "Ali", lastName: "Al-Rashid", phone: "+44 7700 900456" },
    create: {
      firstName: "Ali",
      lastName: "Al-Rashid",
      email: "parent2@example.com",
      password: parent2Password,
      role: "PARENT",
      phone: "+44 7700 900456",
    },
  });

  let parent2 = await prisma.parent.findUnique({ where: { userId: parentUser2.id } });
  if (!parent2) {
    parent2 = await prisma.parent.create({ data: { userId: parentUser2.id } });
  }

  // Students
  let aisha = await prisma.student.findFirst({ where: { name: "Aisha Johnson" } });
  if (!aisha) {
    aisha = await prisma.student.create({
      data: {
        name: "Aisha Johnson",
        classId: girls.id,
        studentSubjects: {
          create: [{ subjectId: english.id }, { subjectId: maths.id }, { subjectId: science.id }, { subjectId: arabic.id }],
        },
        parentStudents: { create: { parentId: parent1.id } },
      },
    });
  }

  let zainab = await prisma.student.findFirst({ where: { name: "Zainab Ali" } });
  if (!zainab) {
    zainab = await prisma.student.create({
      data: {
        name: "Zainab Ali",
        classId: girls.id,
        studentSubjects: {
          create: [{ subjectId: english.id }, { subjectId: maths.id }, { subjectId: mandarin.id }],
        },
      },
    });
  }

  let yusuf = await prisma.student.findFirst({ where: { name: "Yusuf Al-Rashid" } });
  if (!yusuf) {
    yusuf = await prisma.student.create({
      data: {
        name: "Yusuf Al-Rashid",
        classId: olderBoys.id,
        studentSubjects: {
          create: [{ subjectId: science.id }, { subjectId: cs.id }, { subjectId: maths.id }],
        },
        parentStudents: { create: { parentId: parent2.id } },
      },
    });
  }

  let ibrahim = await prisma.student.findFirst({ where: { name: "Ibrahim Al-Rashid" } });
  if (!ibrahim) {
    ibrahim = await prisma.student.create({
      data: {
        name: "Ibrahim Al-Rashid",
        classId: olderBoys.id,
        studentSubjects: {
          create: [{ subjectId: science.id }, { subjectId: cs.id }, { subjectId: electronics.id }],
        },
        parentStudents: { create: { parentId: parent2.id } },
      },
    });
  }

  // ─── Assignments (teacher1 — English & Maths for Girls) ───────────────────────

  const englishHW1 = await prisma.assignment.upsert({
    where: { id: "seed-eng-hw1" },
    update: {},
    create: {
      id: "seed-eng-hw1",
      title: "Chapter 5 Reading Comprehension",
      type: "HOMEWORK",
      subjectId: english.id,
      teacherId: teacher1.id,
      maxMarks: 20,
      deadline: daysAgo(14),
      marks: {
        create: [
          { studentId: aisha.id, marks: 17, handedStatus: "HANDED" },
          { studentId: zainab.id, marks: 15, handedStatus: "HANDED" },
        ],
      },
    },
  });

  const englishHW2 = await prisma.assignment.upsert({
    where: { id: "seed-eng-hw2" },
    update: {},
    create: {
      id: "seed-eng-hw2",
      title: "Essay: My Favourite Book",
      type: "HOMEWORK",
      subjectId: english.id,
      teacherId: teacher1.id,
      maxMarks: 30,
      deadline: daysAgo(7),
      marks: {
        create: [
          { studentId: aisha.id, marks: 26, handedStatus: "HANDED" },
          { studentId: zainab.id, marks: null, handedStatus: "OVERDUE" },
        ],
      },
    },
  });

  const englishHW3 = await prisma.assignment.upsert({
    where: { id: "seed-eng-hw3" },
    update: {},
    create: {
      id: "seed-eng-hw3",
      title: "Grammar Worksheet — Tenses",
      type: "HOMEWORK",
      subjectId: english.id,
      teacherId: teacher1.id,
      maxMarks: 25,
      deadline: daysFromNow(7),
      marks: {
        create: [
          { studentId: aisha.id, handedStatus: "PENDING" },
          { studentId: zainab.id, handedStatus: "PENDING" },
        ],
      },
    },
  });

  // End-of-year English assessment — end of June before summer break
  await prisma.assignment.upsert({
    where: { id: "seed-eng-assess1" },
    update: {},
    create: {
      id: "seed-eng-assess1",
      title: "Summer Term Assessment",
      type: "ASSESSMENT",
      subjectId: english.id,
      teacherId: teacher1.id,
      maxMarks: 100,
      deadline: juneDate(27),
      marks: {
        create: [
          { studentId: aisha.id, handedStatus: "PENDING" },
          { studentId: zainab.id, handedStatus: "PENDING" },
        ],
      },
    },
  });

  const mathsHW1 = await prisma.assignment.upsert({
    where: { id: "seed-math-hw1" },
    update: {},
    create: {
      id: "seed-math-hw1",
      title: "Algebra — Simultaneous Equations",
      type: "HOMEWORK",
      subjectId: maths.id,
      teacherId: teacher1.id,
      maxMarks: 40,
      deadline: daysAgo(10),
      marks: {
        create: [
          { studentId: aisha.id, marks: 35, handedStatus: "HANDED" },
          { studentId: zainab.id, marks: 28, handedStatus: "HANDED" },
        ],
      },
    },
  });

  const mathsHW2 = await prisma.assignment.upsert({
    where: { id: "seed-math-hw2" },
    update: {},
    create: {
      id: "seed-math-hw2",
      title: "Statistics — Data Analysis",
      type: "HOMEWORK",
      subjectId: maths.id,
      teacherId: teacher1.id,
      maxMarks: 30,
      deadline: daysFromNow(5),
      marks: {
        create: [
          { studentId: aisha.id, handedStatus: "PENDING" },
          { studentId: zainab.id, handedStatus: "PENDING" },
        ],
      },
    },
  });

  // June Maths assessment
  await prisma.assignment.upsert({
    where: { id: "seed-math-assess1" },
    update: {},
    create: {
      id: "seed-math-assess1",
      title: "End of Year Maths Assessment",
      type: "ASSESSMENT",
      subjectId: maths.id,
      teacherId: teacher1.id,
      maxMarks: 100,
      deadline: juneDate(20),
      marks: {
        create: [
          { studentId: aisha.id, handedStatus: "PENDING" },
          { studentId: zainab.id, handedStatus: "PENDING" },
        ],
      },
    },
  });

  // ─── Assignments (teacher2 — Science & CS for Older Boys) ─────────────────────

  const scienceHW1 = await prisma.assignment.upsert({
    where: { id: "seed-sci-hw1" },
    update: {},
    create: {
      id: "seed-sci-hw1",
      title: "Forces & Motion Worksheet",
      type: "HOMEWORK",
      subjectId: science.id,
      teacherId: teacher2.id,
      maxMarks: 30,
      deadline: daysAgo(12),
      marks: {
        create: [
          { studentId: yusuf.id, marks: 25, handedStatus: "HANDED" },
          { studentId: ibrahim.id, marks: 22, handedStatus: "HANDED" },
        ],
      },
    },
  });

  // June Science assessment
  await prisma.assignment.upsert({
    where: { id: "seed-sci-assess1" },
    update: {},
    create: {
      id: "seed-sci-assess1",
      title: "Science Summer Assessment",
      type: "ASSESSMENT",
      subjectId: science.id,
      teacherId: teacher2.id,
      maxMarks: 100,
      deadline: juneDate(25),
      marks: {
        create: [
          { studentId: yusuf.id, handedStatus: "PENDING" },
          { studentId: ibrahim.id, handedStatus: "PENDING" },
        ],
      },
    },
  });

  // ─── Behaviour records ────────────────────────────────────────────────────────

  const behaviourData: Array<{
    studentId: string;
    subjectId: string;
    teacherId: string;
    daysAgo: number;
    b: number; a: number; e: number;
    note?: string;
  }> = [
    // Aisha — English
    { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 35, b: 5, a: 4, e: 5 },
    { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 28, b: 4, a: 5, e: 4 },
    { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 21, b: 5, a: 4, e: 5 },
    { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 14, b: 3, a: 3, e: 4, note: "Seemed tired today" },
    { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 7, b: 5, a: 5, e: 5 },
    // Aisha — Maths
    { studentId: aisha.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 33, b: 4, a: 4, e: 4 },
    { studentId: aisha.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 26, b: 3, a: 4, e: 3, note: "Struggled with quadratics" },
    { studentId: aisha.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 19, b: 4, a: 5, e: 4 },
    { studentId: aisha.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 12, b: 5, a: 5, e: 5, note: "Excellent improvement!" },
    // Zainab — English
    { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 35, b: 3, a: 3, e: 3 },
    { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 28, b: 4, a: 3, e: 4 },
    { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 21, b: 2, a: 2, e: 2, note: "Disruptive during reading" },
    { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 14, b: 4, a: 4, e: 3 },
    { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, daysAgo: 7, b: 3, a: 4, e: 4 },
    // Zainab — Maths
    { studentId: zainab.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 33, b: 5, a: 4, e: 5 },
    { studentId: zainab.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 26, b: 4, a: 4, e: 4 },
    { studentId: zainab.id, subjectId: maths.id, teacherId: teacher1.id, daysAgo: 19, b: 5, a: 5, e: 5 },
    // Yusuf — Science
    { studentId: yusuf.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 30, b: 4, a: 4, e: 4 },
    { studentId: yusuf.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 23, b: 5, a: 5, e: 4 },
    { studentId: yusuf.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 16, b: 3, a: 4, e: 3 },
    { studentId: yusuf.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 9, b: 4, a: 5, e: 5 },
    // Ibrahim — Science
    { studentId: ibrahim.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 30, b: 2, a: 3, e: 2, note: "Chatting with classmates" },
    { studentId: ibrahim.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 23, b: 3, a: 3, e: 3 },
    { studentId: ibrahim.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 16, b: 4, a: 3, e: 4 },
    { studentId: ibrahim.id, subjectId: science.id, teacherId: teacher2.id, daysAgo: 9, b: 3, a: 4, e: 3 },
  ];

  for (const rec of behaviourData) {
    const lessonDate = daysAgo(rec.daysAgo);
    await prisma.behaviour.upsert({
      where: { studentId_subjectId_lessonDate: { studentId: rec.studentId, subjectId: rec.subjectId, lessonDate } },
      update: {},
      create: {
        studentId: rec.studentId,
        subjectId: rec.subjectId,
        teacherId: rec.teacherId,
        lessonDate,
        behaviourStars: rec.b,
        attentiveStars: rec.a,
        engagementStars: rec.e,
        note: rec.note,
      },
    });
  }

  // ─── Attendance records ───────────────────────────────────────────────────────

  const attendanceSessions = [35, 28, 21, 14, 7, 2];
  for (const dAgo of attendanceSessions) {
    const sessionDate = daysAgo(dAgo);

    const records = [
      { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, status: "PRESENT" as const },
      { studentId: aisha.id, subjectId: maths.id, teacherId: teacher1.id, status: "PRESENT" as const },
      { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, status: dAgo === 21 ? "ABSENT" as const : "PRESENT" as const },
      { studentId: zainab.id, subjectId: maths.id, teacherId: teacher1.id, status: "PRESENT" as const },
      { studentId: yusuf.id, subjectId: science.id, teacherId: teacher2.id, status: "PRESENT" as const },
      { studentId: ibrahim.id, subjectId: science.id, teacherId: teacher2.id, status: dAgo === 14 ? "LATE" as const : "PRESENT" as const },
    ];

    for (const rec of records) {
      await prisma.attendance.upsert({
        where: { studentId_subjectId_sessionDate: { studentId: rec.studentId, subjectId: rec.subjectId, sessionDate } },
        update: {},
        create: { ...rec, sessionDate },
      });
    }
  }

  // ─── Predicted grades ─────────────────────────────────────────────────────────

  const gradeData = [
    { studentId: aisha.id, subjectId: english.id, teacherId: teacher1.id, grade: "A" as const },
    { studentId: aisha.id, subjectId: maths.id, teacherId: teacher1.id, grade: "B" as const },
    { studentId: zainab.id, subjectId: english.id, teacherId: teacher1.id, grade: "B" as const },
    { studentId: zainab.id, subjectId: maths.id, teacherId: teacher1.id, grade: "A" as const },
    { studentId: yusuf.id, subjectId: science.id, teacherId: teacher2.id, grade: "A_STAR" as const },
    { studentId: ibrahim.id, subjectId: science.id, teacherId: teacher2.id, grade: "C" as const },
  ];

  for (const g of gradeData) {
    await prisma.predictedGrade.upsert({
      where: { studentId_subjectId: { studentId: g.studentId, subjectId: g.subjectId } },
      update: {},
      create: g,
    });
  }

  // ─── Class materials ──────────────────────────────────────────────────────────

  const materials = [
    { id: "seed-mat-1", teacherId: teacher1.id, subjectId: english.id, title: "Chapter 5 — Of Mice and Men Notes", fileUrl: "https://example.com/files/eng-ch5.pdf", fileKey: "materials/eng-ch5.pdf" },
    { id: "seed-mat-2", teacherId: teacher1.id, subjectId: english.id, title: "Grammar Reference Sheet", fileUrl: "https://example.com/files/grammar-ref.pdf", fileKey: "materials/grammar-ref.pdf" },
    { id: "seed-mat-3", teacherId: teacher1.id, subjectId: maths.id, title: "Quadratic Equations Worked Examples", fileUrl: "https://example.com/files/quadratics.pdf", fileKey: "materials/quadratics.pdf" },
    { id: "seed-mat-4", teacherId: teacher1.id, subjectId: maths.id, title: "Statistics — Revision Slides", fileUrl: "https://example.com/files/stats-slides.pdf", fileKey: "materials/stats-slides.pdf" },
    { id: "seed-mat-5", teacherId: teacher2.id, subjectId: science.id, title: "Forces & Motion — Class Notes", fileUrl: "https://example.com/files/forces.pdf", fileKey: "materials/forces.pdf" },
    { id: "seed-mat-6", teacherId: teacher2.id, subjectId: cs.id, title: "Python Basics Handout", fileUrl: "https://example.com/files/python-basics.pdf", fileKey: "materials/python-basics.pdf" },
  ];

  for (const m of materials) {
    const existing = await prisma.classMaterial.findUnique({ where: { id: m.id } });
    if (!existing) await prisma.classMaterial.create({ data: m });
  }

  // ─── Incident logs ────────────────────────────────────────────────────────────

  const incidents = [
    {
      id: "seed-inc-1",
      studentId: zainab.id,
      teacherId: teacher1.id,
      subjectId: english.id,
      date: daysAgo(21),
      title: "Disruption during lesson",
      description: "Zainab was repeatedly talking and distracting other students during the reading exercise. She was reminded of classroom rules.",
      severity: "MINOR" as const,
    },
    {
      id: "seed-inc-2",
      studentId: ibrahim.id,
      teacherId: teacher2.id,
      subjectId: science.id,
      date: daysAgo(30),
      title: "Equipment misuse",
      description: "Ibrahim was misusing lab equipment during the practical session. No injury occurred but the matter was noted.",
      severity: "MODERATE" as const,
    },
    {
      id: "seed-inc-3",
      studentId: ibrahim.id,
      teacherId: teacher2.id,
      subjectId: null,
      date: daysAgo(10),
      title: "Late arrival pattern",
      description: "Ibrahim has been consistently late to sessions over the past two weeks. Parent contact recommended.",
      severity: "MINOR" as const,
    },
  ];

  for (const inc of incidents) {
    const existing = await prisma.incidentLog.findUnique({ where: { id: inc.id } });
    if (!existing) await prisma.incidentLog.create({ data: inc });
  }

  // ─── Notices ──────────────────────────────────────────────────────────────────

  const notices = [
    { id: "seed-notice-1", teacherId: teacher1.id, subjectId: english.id, title: "Assessment Reminder", body: "Summer Term Assessment on 27th June — please ensure all coursework is submitted beforehand." },
    { id: "seed-notice-2", teacherId: teacher1.id, subjectId: maths.id, title: "Revision Resources", body: "Please see the class materials section for the Statistics revision slides." },
    { id: "seed-notice-3", teacherId: teacher2.id, subjectId: science.id, title: "Science Assessment — 25th June", body: "The end-of-year Science assessment will cover all topics from this term. Revision checklist attached." },
  ];

  for (const n of notices) {
    const existing = await prisma.notice.findUnique({ where: { id: n.id } });
    if (!existing) await prisma.notice.create({ data: n });
  }

  console.log("✓ Seed complete");
  console.log("  admin@ltpcentre.com    / admin123!");
  console.log("  teacher@ltpcentre.com  / teacher123!   (English + Maths, Girls class)");
  console.log("  teacher2@ltpcentre.com / teacher2!     (Science + CS, Older Boys)");
  console.log("  parent@example.com     / parent123!    (Aisha Johnson — Girls)");
  console.log("  parent2@example.com    / parent2!      (Yusuf + Ibrahim Al-Rashid — Older Boys)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
