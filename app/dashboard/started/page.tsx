import { redirect } from "next/navigation";

type StartedPageProps = {
  searchParams?: {
    plan?: string;
    integration?: string;
  };
};

export default function StartedPage({ searchParams }: StartedPageProps) {
  const params = new URLSearchParams();
  if (searchParams?.plan) {
    params.set("plan", searchParams.plan);
  }
  if (searchParams?.integration) {
    params.set("integration", searchParams.integration);
  }

  redirect(params.toString() ? `/signup?${params.toString()}` : "/signup");
}
