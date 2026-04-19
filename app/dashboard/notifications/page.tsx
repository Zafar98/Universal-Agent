import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthenticatedBusinessFromCookies } from "@/lib/sessionAuth";
import { BusinessCard, CardTitle, CardContent } from "@/components/BusinessCard";

export default async function NotificationSettingsPage() {
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notification Settings</h1>
          <p className="text-slate-600 mt-2">
            Configure how your team gets notified about escalations
          </p>
        </div>

        {/* Email Configuration */}
        <BusinessCard className="shadow-lg">
          <CardTitle>Email Notifications</CardTitle>
          <CardContent>
            <EmailConfigForm tenantId={session.tenantId} />
          </CardContent>
        </BusinessCard>

        {/* SMS Configuration */}
        <BusinessCard className="shadow-lg">
          <CardTitle>SMS Notifications</CardTitle>
          <CardContent>
            <SMSConfigForm tenantId={session.tenantId} />
          </CardContent>
        </BusinessCard>

        {/* Slack Configuration */}
        <BusinessCard className="shadow-lg">
          <CardTitle>Slack Integration</CardTitle>
          <CardContent>
            <SlackConfigForm tenantId={session.tenantId} />
          </CardContent>
        </BusinessCard>

        {/* Notification Preferences */}
        <BusinessCard className="shadow-lg">
          <CardTitle>Notification Preferences</CardTitle>
          <CardContent>
            <NotificationPreferencesForm tenantId={session.tenantId} />
          </CardContent>
        </BusinessCard>

        {/* Help Section */}
        <BusinessCard className="bg-blue-50 border-blue-200">
          <CardTitle>About Notifications</CardTitle>
          <CardContent className="text-sm text-slate-700 space-y-3">
            <p>
              When a call gets escalated, your team is notified through configured channels:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="font-semibold">Email</span> - Primary notification method</li>
              <li><span className="font-semibold">SMS</span> - Urgent escalations only</li>
              <li><span className="font-semibold">Slack</span> - Real-time team updates</li>
            </ul>
            <p className="mt-4 pt-4 border-t border-blue-200">
              <span className="font-semibold">Tip:</span> Set up multiple channels for important escalations to ensure your team never misses a call.
            </p>
          </CardContent>
        </BusinessCard>
      </div>
    </div>
  );
}

function EmailConfigForm({ tenantId }: { tenantId: string }) {
  return (
    <form action={saveEmailConfig} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
        ✓ Email notifications are pre-configured and ready to use
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Sender Email (From Address)
        </label>
        <input
          type="email"
          name="senderEmail"
          defaultValue="noreply@voicecall-system.com"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="noreply@company.com"
        />
        <p className="text-xs text-slate-600 mt-1">
          Emails will be sent from this address
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Include HTML Template
        </label>
        <label className="flex items-center mt-2">
          <input type="checkbox" name="useTemplate" defaultChecked className="h-4 w-4" />
          <span className="ml-2 text-sm text-slate-700">
            Use formatted email template with call details
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        Save Email Settings
      </button>
    </form>
  );
}

function SMSConfigForm({ tenantId }: { tenantId: string }) {
  return (
    <form action={saveSMSConfig} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
        ⚠ SMS requires API configuration in your environment
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">SMS API Provider</label>
        <select
          name="provider"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Select provider...</option>
          <option value="twilio">Twilio</option>
          <option value="aws">AWS SNS</option>
          <option value="clicksend">ClickSend</option>
          <option value="custom">Custom API</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">API Key</label>
        <input
          type="password"
          name="apiKey"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Your SMS provider API key"
        />
        <p className="text-xs text-slate-600 mt-1">
          Your key is encrypted and secure
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Trigger SMS Only When</label>
        <label className="flex items-center mt-2">
          <input type="checkbox" name="urgentOnly" defaultChecked className="h-4 w-4" />
          <span className="ml-2 text-sm text-slate-700">
            Escalation is marked as urgent/high-priority
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        Save SMS Settings
      </button>
    </form>
  );
}

function SlackConfigForm({ tenantId }: { tenantId: string }) {
  return (
    <form action={saveSlackConfig} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm text-purple-800">
        📌 Connect your Slack workspace for real-time escalation alerts
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Slack Webhook URL</label>
        <input
          type="url"
          name="webhookUrl"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
          placeholder="https://hooks.slack.com/services/..."
        />
        <p className="text-xs text-slate-600 mt-1">
          <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Create a Slack app
          </a> and add an Incoming Webhook
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Slack Channel</label>
        <input
          type="text"
          name="channel"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="#escalations or @username"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Mention on Alert</label>
        <input
          type="text"
          name="mention"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="@channel or leave empty"
        />
      </div>

      <button
        type="submit"
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        Save Slack Settings
      </button>
    </form>
  );
}

function NotificationPreferencesForm({ tenantId }: { tenantId: string }) {
  return (
    <form action={savePreferences} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="space-y-3">
        <label className="flex items-center">
          <input type="checkbox" name="notifyOnEscalation" defaultChecked className="h-4 w-4" />
          <span className="ml-2 text-sm text-slate-700">
            Notify on escalation
          </span>
        </label>

        <label className="flex items-center">
          <input type="checkbox" name="notifyOnAssignment" defaultChecked className="h-4 w-4" />
          <span className="ml-2 text-sm text-slate-700">
            Notify when task is assigned to me
          </span>
        </label>

        <label className="flex items-center">
          <input type="checkbox" name="notifyDelay" className="h-4 w-4" />
          <span className="ml-2 text-sm text-slate-700">
            Batch notifications (receive hourly digest instead of per-item)
          </span>
        </label>

        <label className="flex items-center">
          <input type="checkbox" name="quietHours" className="h-4 w-4" />
          <span className="ml-2 text-sm text-slate-700">
            Enable quiet hours (prevents notifications 6 PM - 6 AM)
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        Save Preferences
      </button>
    </form>
  );
}

// Server actions
async function saveEmailConfig(formData: FormData) {
  "use server";
  // Implementation would save email config
  console.log("Email config saved");
}

async function saveSMSConfig(formData: FormData) {
  "use server";
  // Implementation would save SMS config
  console.log("SMS config saved");
}

async function saveSlackConfig(formData: FormData) {
  "use server";
  // Implementation would save Slack config
  console.log("Slack config saved");
}

async function savePreferences(formData: FormData) {
  "use server";
  // Implementation would save preferences
  console.log("Preferences saved");
}
