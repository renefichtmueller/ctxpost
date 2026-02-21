"use server";

import { auth } from "@/lib/auth";
import { exportFeedbackAsTrainingData } from "@/lib/feedback";

export async function exportTrainingData() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    const data = await exportFeedbackAsTrainingData(session.user.id);

    if (data.length === 0) {
      return { error: "no_data", count: 0 };
    }

    // Convert to JSONL format
    const jsonl = data.map((item) => JSON.stringify(item)).join("\n");

    return { success: true, data: jsonl, count: data.length };
  } catch {
    return { error: "export_failed" };
  }
}
