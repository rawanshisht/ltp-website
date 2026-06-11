"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  paramKey?: string;
}

export function SearchBar({ placeholder = "Search…", paramKey = "search" }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set(paramKey, e.target.value);
    else params.delete(paramKey);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative w-64 mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-foreground) pointer-events-none" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        defaultValue={searchParams.get(paramKey) ?? ""}
        onChange={handleChange}
      />
    </div>
  );
}
