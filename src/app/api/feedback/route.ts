import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { exportFeedbackAsTrainingData, getFeedbackStats } from "@/lib/feedback";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "export") {
    // Export feedback as training data
    const data = await exportFeedbackAsTrainingData(session.user.id);
    return NextResponse.json({ data, count: data.length });
  }

  // Default: return stats
  const stats = await getFeedbackStats(session.user.id);
  return NextResponse.json(stats);
}
