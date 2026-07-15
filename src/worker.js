const DESTINATION_URL = "https://hoo.be/barbellinaa";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (
      url.pathname === "/api/verify-turnstile" &&
      request.method === "POST"
    ) {
      return verifyTurnstile(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function verifyTurnstile(request, env) {
  try {
    const requestBody = await request.json();
    const token = requestBody.token;
    const ageConfirmed = requestBody.ageConfirmed;

    if (ageConfirmed !== true) {
      return jsonResponse(
        {
          success: false,
          message: "You must confirm that you are at least 18."
        },
        400
      );
    }

    if (!token || typeof token !== "string") {
      return jsonResponse(
        {
          success: false,
          message: "Please complete the security check."
        },
        400
      );
    }

    const formData = new FormData();

    formData.append(
      "secret",
      env.TURNSTILE_SECRET_KEY
    );

    formData.append("response", token);

    const clientIp =
      request.headers.get("CF-Connecting-IP");

    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData
      }
    );

    const verification =
      await verificationResponse.json();

    if (!verification.success) {
      const errorCodes =
        verification["error-codes"] || [];

      console.log(
         "Turnstile verification failed:",
          errorCodes
        );

        return jsonResponse(
        {
          success: false,
          message:
            "The security check failed.",
          errorCodes
        },
        403
      );
    }

    return jsonResponse({
      success: true,
      redirectUrl: DESTINATION_URL
    });
  } catch (error) {
    console.error("Verification error:", error);

    return jsonResponse(
      {
        success: false,
        message:
          "The verification service is temporarily unavailable."
      },
      500
    );
  }
}

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}