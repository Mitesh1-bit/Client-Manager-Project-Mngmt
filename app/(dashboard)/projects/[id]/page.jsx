import { redirect } from "next/navigation";

/**
 * The project route structure in the brief has no separate overview — the six
 * planning views are the project. The board is the one people live in, so it
 * is the default.
 */
export default async function ProjectIndexPage({ params }) {
  const { id } = await params;
  redirect(`/projects/${id}/board`);
}
