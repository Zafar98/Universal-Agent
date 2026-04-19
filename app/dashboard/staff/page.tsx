import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthenticatedBusinessFromCookies } from "@/lib/sessionAuth";
import ScrollPaginationContainer from "@/components/ScrollPaginationContainer";
import { BusinessCard, CardTitle, CardContent } from "@/components/BusinessCard";
import StaffListClient from "./StaffListClient";

export default async function StaffManagementPage() {
  const session = await getAuthenticatedBusinessFromCookies(await cookies());

  if (!session) {
    redirect("/auth");
  }
  
  if (!session || session.isAdmin) {
    // Admin needs to access specific tenant
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
            <p className="text-slate-600 mt-2">
              Manage team members, assignments & capacity
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff List - Left Column */}
          <div className="lg:col-span-2">
            <BusinessCard className="shadow-lg">
              <CardTitle>Team Members</CardTitle>
              <CardContent className="space-y-4">
                <StaffListClient tenantId={session.tenantId} />
              </CardContent>
            </BusinessCard>
          </div>

          {/* Right Sidebar - Quick Actions */}
          <div className="space-y-4">
            {/* Add Staff Form */}
            <BusinessCard className="shadow-lg">
              <CardTitle>New Staff Member</CardTitle>
              <CardContent>
                <AddStaffForm tenantId={session.tenantId} />
              </CardContent>
            </BusinessCard>

            {/* Capacity Info */}
            <BusinessCard className="bg-blue-50 border-blue-200">
              <CardTitle>About Capacity</CardTitle>
              <CardContent className="text-sm text-slate-700">
                <p className="mb-3">
                  Set <span className="font-semibold">Max Open Items</span> per staff member to prevent overload:
                </p>
                <ul className="space-y-2 text-xs">
                  <li>• <span className="font-semibold">5-10</span>: Light load, quick resolution</li>
                  <li>• <span className="font-semibold">10-20</span>: Moderate load, standard workday</li>
                  <li>• <span className="font-semibold">20+</span>: High capacity specialists</li>
                </ul>
              </CardContent>
            </BusinessCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddStaffForm({ tenantId }: { tenantId: string }) {
  return (
    <form action={createStaffAction} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div>
        <label className="text-sm font-semibold text-slate-700">Name</label>
        <input
          type="text"
          name="name"
          required
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="E.g., Sarah Johnson"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="sarah@company.com"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Phone</label>
        <input
          type="tel"
          name="phone"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Role</label>
        <select
          name="role"
          required
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Select role...</option>
          <option value="specialist">Specialist</option>
          <option value="supervisor">Supervisor</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Max Open Items</label>
        <input
          type="number"
          name="maxOpenItems"
          defaultValue="10"
          min="1"
          max="100"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        Add Staff Member
      </button>
    </form>
  );
}

async function createStaffAction(formData: FormData) {
  "use server";

  const cookies_store = await cookies();
  const session = await getAuthenticatedBusinessFromCookies(cookies_store);
  if (!session) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const maxOpenItems = parseInt(formData.get("maxOpenItems") as string, 10);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/staff`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-staff",
          name,
          email,
          phone,
          role,
          maxOpenItems,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create staff member");
    }

    return redirect("/dashboard/staff");
  } catch (error) {
    console.error("Error creating staff:", error);
    throw error;
  }
}
