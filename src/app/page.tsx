import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen p-4">
      <Link href="/dialoggame">Game</Link>
    </main>
  );
}
