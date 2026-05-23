"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Teacher = {
  id: string;
  name: string;
  email: string;
  subjects: string[];
};

export function ContactTeacherCard({ teachers, childName }: { teachers: Teacher[]; childName: string }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = teachers.find((t) => t.id === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact a Teacher</CardTitle>
        <CardDescription>Select a teacher to open your email client</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a teacher…" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-xs text-(--muted-foreground)">Teaches</p>
              <p className="text-sm">{selected.subjects.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs text-(--muted-foreground)">Email</p>
              <p className="text-sm font-mono break-all">{selected.email}</p>
            </div>
            <Button className="w-full" asChild>
              <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${childName}`)}`}>
                <Mail className="h-4 w-4 mr-2" />
                Open Email Client
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
