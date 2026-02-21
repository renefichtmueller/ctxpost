import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 px-4">
      <Link
        href="/"
        className="flex items-center gap-3 mb-8 text-xl font-bold"
      >
        <Image src="/logo.svg" alt="Social Scheduler" width={40} height={40} className="rounded-xl" />
        Social Scheduler
      </Link>
      {children}
    </div>
  );
}
