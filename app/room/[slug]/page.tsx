import { KanbanBoard } from "@/components/KanbanBoard";
import OnlineUsers from "@/components/OnlineUsers";
import Room from "@/components/Room";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  return (
    
    <Room room={slug}>
      <main
        className={`h-screen flex items-center justify-between flex-col`}
      >
        <OnlineUsers />
        <KanbanBoard roomId={slug} />
        <footer></footer>
      </main>
    </Room>
  );
}
