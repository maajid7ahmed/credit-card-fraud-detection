// app/api/predict/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract model and payload
    const { model, ...payload } = body;
    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 });
    }

    // Send request to your Python backend
    const response = await fetch(`http://localhost:8000/predict?model=${encodeURIComponent(model)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text || "Backend error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
