import { CallInterface } from "@/components/VoiceCall/CallInterface";

export default async function TenantCallPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <CallInterface initialTenantId={tenantId} />;
}