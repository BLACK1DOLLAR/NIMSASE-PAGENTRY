import { isAdminAuthenticated } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { serializeContestant } from "@/lib/serialize";
import { getSettings, serializeSettings } from "@/lib/settings";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminAuthenticated()) {
    return <AdminLogin />;
  }

  await connectToDatabase();
  const [contestants, settings] = await Promise.all([
    Contestant.find().sort({ name: 1 }),
    getSettings(),
  ]);

  return (
    <AdminDashboard
      initialContestants={contestants.map(serializeContestant)}
      initialSettings={serializeSettings(settings)}
    />
  );
}
