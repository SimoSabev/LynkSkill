// app/onboarding/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // This handler allows the internal Server Action POST to succeed.
    // The Server Action itself handles the actual logic.
    return new NextResponse(null, { status: 200 });
}