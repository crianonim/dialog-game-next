import Image from "next/image";
import Screept from "./screept/page";

export default function Home() {
  return (
    <main className="flex min-h-screen p-4">
      <Screept />
    </main>
  );
}
