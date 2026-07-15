const form =
  document.getElementById("age-form");

const confirmButton =
  document.getElementById("confirm-button");

const ageCheckbox =
  document.getElementById("age-confirmed");

const errorMessage =
  document.getElementById("error-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorMessage.textContent = "";

  if (!ageCheckbox.checked) {
    errorMessage.textContent =
      "You must confirm that you are at least 18.";

    return;
  }

  const formData = new FormData(form);

  const turnstileToken =
    formData.get("cf-turnstile-response");

  if (!turnstileToken) {
    errorMessage.textContent =
      "Please complete the security check first.";

    return;
  }

  confirmButton.disabled = true;
  confirmButton.textContent = "Verifying...";

  try {
    const response = await fetch(
      "https://barbie2.korbynboksner.workers.dev/api/verify-turnstile",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          token: turnstileToken,
          ageConfirmed: true
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Verification failed."
      );
    }

    window.location.assign(result.redirectUrl);
  } catch (error) {
    errorMessage.textContent =
      error.message ||
      "Unable to verify. Please try again.";

    confirmButton.disabled = false;
    confirmButton.textContent =
      "Confirm and Continue";

    if (window.turnstile) {
      window.turnstile.reset();
    }
  }
});