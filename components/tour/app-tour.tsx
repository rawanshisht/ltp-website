"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { Role } from "@prisma/client";
import { getTourSteps } from "@/lib/tours";
import { HelpCircle } from "lucide-react";

export function AppTour({ role }: { role: Role }) {
  function startTour() {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0.55)",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done",
      steps: getTourSteps(role),
    });
    driverObj.drive();
  }

  return (
    <button
      onClick={startTour}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
    >
      <HelpCircle className="h-4 w-4" />
      Take a Tour
    </button>
  );
}
