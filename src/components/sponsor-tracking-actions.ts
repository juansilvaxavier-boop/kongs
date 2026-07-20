"use server";

import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function trackSponsorEvent(
  sponsorId: string,
  eventType: "view" | "click"
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("track_sponsor_event", {
      p_sponsor_id: sponsorId,
      p_event_type: eventType,
    });
    if (error) throw new Error(error.message);
  });
}
