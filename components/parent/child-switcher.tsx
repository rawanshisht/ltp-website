"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

interface Child {
  id: string;
  name: string;
}

interface ChildSwitcherProps {
  children: Child[];
  selectedId: string;
}

export function ChildSwitcher({ children, selectedId }: ChildSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("child", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (children.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-[--muted-foreground]" />
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              {child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
