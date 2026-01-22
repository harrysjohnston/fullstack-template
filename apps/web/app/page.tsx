import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">fullstack-template</h1>
        <p className="text-muted-foreground">
          Next.js + TypeScript scaffold. Tailwind and shadcn/ui are now wired up.
        </p>
        <div className="flex gap-3">
          <Button>Get started</Button>
          <Button variant="outline">View docs</Button>
        </div>
      </div>
    </main>
  );
}
