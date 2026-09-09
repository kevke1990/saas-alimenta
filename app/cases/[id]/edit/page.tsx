import { redirect } from "next/navigation";

export default async function EditCase({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/cases/${id}/edit/wizard`);
}
