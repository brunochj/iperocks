"use client";

import { useUser } from "@/hooks/useUser";

export default function TestPage() {
  const { user, loading } = useUser();

  return (
    <div>
      <pre>Loading: {String(loading)}</pre>
      <pre>User: {JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
