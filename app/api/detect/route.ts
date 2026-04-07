import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json(
                { detail: "File gambar tidak ditemukan dalam request." },
                { status: 400 }
            );
        }

        // Forward to Python FastAPI backend
        const backendForm = new FormData();
        backendForm.append("file", file);

        const backendRes = await fetch(`${BACKEND_URL}/predict`, {
            method: "POST",
            body: backendForm,
        });

        if (!backendRes.ok) {
            const errorData = await backendRes.json().catch(() => ({
                detail: "Backend error",
            }));
            return NextResponse.json(errorData, { status: backendRes.status });
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("[API /detect] Error:", error);

        // Connection refused = backend not running
        const isConnectionError =
            error instanceof Error &&
            (error.message.includes("ECONNREFUSED") ||
                error.message.includes("fetch failed") ||
                error.message.includes("connect"));

        if (isConnectionError) {
            return NextResponse.json(
                {
                    detail:
                        "Backend server tidak berjalan. Jalankan: cd backend && uvicorn main:app --reload --port 8000",
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { detail: "Terjadi kesalahan internal server." },
            { status: 500 }
        );
    }
}
