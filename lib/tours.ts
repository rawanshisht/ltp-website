import type { DriveStep } from "driver.js";
import type { Role } from "@prisma/client";

const adminSteps: DriveStep[] = [
  {
    popover: {
      title: "Welcome to the Admin Portal",
      description: "This quick tour will walk you through the key sections of the LTP Centre admin dashboard. Use the arrows to navigate.",
    },
  },
  {
    element: "#tour-sidebar",
    popover: {
      title: "Navigation",
      description: "Use this sidebar to move between all sections of the admin portal.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-nav-dashboard",
    popover: {
      title: "Dashboard",
      description: "A bird's-eye view of the centre — total active students, teachers, subjects, and average behaviour scores.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-teachers",
    popover: {
      title: "Teachers",
      description: "Add and manage teachers. Assign each teacher to specific subjects and classes so they can access the right students.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-students",
    popover: {
      title: "Students",
      description: "Manage student enrolments — add new students, link them to a parent, assign subjects, and deactivate leavers.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-behaviour",
    popover: {
      title: "Behaviour",
      description: "View centre-wide behaviour records. Filter by class, subject, or date to spot patterns across all students.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-attendance",
    popover: {
      title: "Attendance",
      description: "Review attendance records across all subjects and classes. See who is consistently late or absent.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-assessments",
    popover: {
      title: "Assessments",
      description: "Browse all assignment marks and predicted GCSE grades for every student across every subject.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-incidents",
    popover: {
      title: "Incidents",
      description: "Review behavioural incidents logged by teachers — a full audit trail for each student.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-settings",
    popover: {
      title: "Settings",
      description: "Change your admin password here.",
      side: "right",
    },
  },
  {
    element: "#tour-user-section",
    popover: {
      title: "Your Account",
      description: "Your profile is shown here. Use the Sign out button when you're done.",
      side: "right",
      align: "end",
    },
  },
];

const teacherSteps: DriveStep[] = [
  {
    popover: {
      title: "Welcome to the Teacher Portal",
      description: "This tour will show you where to find each feature so you can manage your classes with ease.",
    },
  },
  {
    element: "#tour-sidebar",
    popover: {
      title: "Navigation",
      description: "Everything you need is accessible from this sidebar.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-nav-dashboard",
    popover: {
      title: "Dashboard",
      description: "Your home page — see your assigned subjects, classes, student count, attendance charts, and behaviour overview at a glance.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-enter-marks",
    popover: {
      title: "Enter Marks",
      description: "Record marks for individual assignments. Select a subject and assignment, then enter each student's score.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-assignments",
    popover: {
      title: "Assignments",
      description: "Create new assignments, set max marks and deadlines, and track submission status for each student.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-behaviour",
    popover: {
      title: "Behaviour",
      description: "Log per-lesson behaviour scores (Behaviour, Attentiveness, Engagement — rated 1–5). Add optional notes visible to parents.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-attendance",
    popover: {
      title: "Attendance",
      description: "Mark students as Present, Absent, or Late for each session. Records are tied to a specific subject and date.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-class-materials",
    popover: {
      title: "Class Materials",
      description: "Upload files (PDFs, worksheets, slides) for your students. Parents can download them from their portal.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-reports",
    popover: {
      title: "Reports",
      description: "Upload end-of-term report files for individual students. Parents can access these from their portal.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-deadlines",
    popover: {
      title: "Deadlines",
      description: "See all upcoming and overdue assignment deadlines. Check which students have submitted and which are still pending.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-notices",
    popover: {
      title: "Notices",
      description: "Post announcements for a subject. Only parents of students enrolled in that subject will see the notice.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-incidents",
    popover: {
      title: "Incidents",
      description: "Log and review behavioural incidents for students in your classes.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-settings",
    popover: {
      title: "Settings",
      description: "Update your password here.",
      side: "right",
    },
  },
  {
    element: "#tour-user-section",
    popover: {
      title: "Your Account",
      description: "Your name and sign-out button are always here at the bottom of the sidebar.",
      side: "right",
      align: "end",
    },
  },
];

const parentSteps: DriveStep[] = [
  {
    popover: {
      title: "Welcome to the Parent Portal",
      description: "This tour will guide you through everything available to help you stay connected with your child's education at LTP Centre.",
    },
  },
  {
    element: "#tour-sidebar",
    popover: {
      title: "Navigation",
      description: "Use this sidebar to move between sections. If you have more than one child enrolled, use the child switcher at the top of each page.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-nav-dashboard",
    popover: {
      title: "Dashboard",
      description: "Your home screen — a summary of your child's recent attendance, behaviour, and activity.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-subjects-marks",
    popover: {
      title: "Subjects & Marks",
      description: "See all subjects your child is enrolled in, their marks for each assignment, and their predicted GCSE grades.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-behaviour",
    popover: {
      title: "Behaviour",
      description: "Review behaviour records from each lesson — scores for behaviour, attentiveness, and engagement, plus any teacher notes.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-attendance",
    popover: {
      title: "Attendance",
      description: "See your child's attendance history across all subjects — marked as Present, Absent, or Late.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-assessments",
    popover: {
      title: "Assessments",
      description: "View all assignment marks and scores with a breakdown by subject.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-reports",
    popover: {
      title: "Reports",
      description: "Download end-of-term reports uploaded by your child's teachers.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-class-materials",
    popover: {
      title: "Class Materials",
      description: "Access worksheets, slides, and other resources uploaded by your child's teachers.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-homework",
    popover: {
      title: "Homework",
      description: "Submit homework files on behalf of your child for specific assignments.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-deadlines",
    popover: {
      title: "Deadlines",
      description: "A list of all upcoming assignment deadlines so nothing gets missed.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-notices",
    popover: {
      title: "Notices",
      description: "Read announcements posted by teachers for the subjects your child is enrolled in.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-incidents",
    popover: {
      title: "Incidents",
      description: "Any behavioural incidents logged by teachers will appear here.",
      side: "right",
    },
  },
  {
    element: "#tour-nav-settings",
    popover: {
      title: "Settings",
      description: "Update your account password here.",
      side: "right",
    },
  },
  {
    element: "#tour-user-section",
    popover: {
      title: "Your Account",
      description: "Your name and the sign-out button are always here at the bottom of the sidebar.",
      side: "right",
      align: "end",
    },
  },
];

export function getTourSteps(role: Role): DriveStep[] {
  if (role === "ADMIN") return adminSteps;
  if (role === "TEACHER") return teacherSteps;
  return parentSteps;
}
