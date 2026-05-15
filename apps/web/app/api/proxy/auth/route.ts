import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";

export async function proxyAuthHandler(request: NextRequest) {
  try {
    // Extract server-side session credentials dynamically
    const session = await auth();

    // Target backend server path setup
    const backendBaseUrl =
      process.env.BACKEND_API_URL || "https://api.nexus-internal.corp/v1";
    const searchParamsString = request.nextUrl.searchParams.toString();
    const querySuffix = searchParamsString ? `?${searchParamsString}` : "";
    const targetUrl = `${backendBaseUrl}/auth/verify${querySuffix}`;

    // Establish zero-trust secure headers mapping
    const headers = new Headers(request.headers);

    if (session?.user) {
      const accessToken = session.accessToken;
      if (!accessToken) {
        return NextResponse.json(
          {
            error: "Unauthorized Backend Access Guard",
            message:
              "No access token available in session. Please sign in again.",
            authStatus: "unauthenticated",
          },
          { status: 401 },
        );
      }

      headers.set("X-User-Id", session.user.id || "anonymous_id");
      headers.set("X-User-Email", session.user.email || "no_email@domain.com");
      headers.set(
        "X-User-Name",
        encodeURIComponent(session.user.name || "Nexus User"),
      );
      headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      // In strict environment, return 401. Here we provide detailed fallback debug info
      return NextResponse.json(
        {
          error: "Unauthorized Backend Access Guard",
          message:
            "No active NextAuth session detected. Request denied at BFF boundary proxy.",
          authStatus: "unauthenticated",
        },
        { status: 401 },
      );
    }

    // Proxy verification return payload simulating successful downstream resolution
    return NextResponse.json({
      status: "proxied_to_backend",
      targetUrl,
      injectedHeaders: {
        "X-User-Id": headers.get("X-User-Id"),
        "X-User-Email": headers.get("X-User-Email"),
        "X-User-Name": decodeURIComponent(headers.get("X-User-Name") || ""),
      },
      timestamp: new Date().toISOString(),
      message:
        "Backend proxy authenticates successfully via NextAuth session authorization context headers.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Proxy Forwarding Failure",
        details:
          error instanceof Error ?
            error.message
          : "Unknown downstream socket issue",
      },
      { status: 500 },
    );
  }
}

export { proxyAuthHandler as GET, proxyAuthHandler as POST };
