"use client";
import { useSession } from "next-auth/react";

export default function TestPage() {
  const { data: session, status } = useSession();
  return (
    <div>
      <pre>Status: {status}</pre>
      <pre>Session: {JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}