import { Header } from "@/components/layout/header";
import { ChangePasswordForm } from "@/components/shared/change-password-form";

export default function ParentSettingsPage() {
  return (
    <div>
      <Header title="Settings" description="Manage your account" />
      <ChangePasswordForm />
    </div>
  );
}
