"use client";

import { useEffect, useState } from "react";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { AccountantChat } from "@/components/accountant-chat";

export default function ChatPage() {
  const live = useLive();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOk(true);
    })();
  }, [live]);

  if (!ok) return null;
  return <AccountantChat studio />;
}
