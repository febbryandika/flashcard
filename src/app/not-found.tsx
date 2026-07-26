import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12">
        <h2 className="font-medium">Page not found</h2>
        <p className="text-muted-foreground text-sm">
          That page doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/decks" className={buttonVariants({ className: "mt-2" })}>
          Back to decks
        </Link>
      </div>
    </div>
  );
}
