import { setUserSettings, getUserSettings } from "@/lib/ai/cache";
import type { AiSettings } from "@/lib/ai/types";

export async function loadAiSettings(userId: string): Promise<AiSettings> {
  return getUserSettings(userId);
}

export async function saveAiSettings(userId: string, s: AiSettings): Promise<void> {
  await setUserSettings(userId, s);
}
