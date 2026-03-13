import Link from "next/link";
import { auth } from "@/auth";

interface Props {
  hrefAuthed: string;
  hrefUnauthed: string;
  className?: string;
  children: React.ReactNode;
}

export default async function AuthCTA({ hrefAuthed, hrefUnauthed, className, children }: Props) {
  const session = await auth();
  const href = session?.user?.id ? hrefAuthed : hrefUnauthed;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
