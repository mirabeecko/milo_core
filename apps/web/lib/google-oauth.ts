export async function connectGoogle(
  service: "calendar" | "email",
  onComplete: () => void,
): Promise<void> {
  const response = await fetch(`/api/${service}/auth-url`);

  if (!response.ok) {
    throw new Error("Nepodařilo se získat autorizační URL");
  }

  const { url } = (await response.json()) as { url: string };

  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    url,
    "google-oauth",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  if (!popup) {
    throw new Error("Popup byl zablokován prohlížečem");
  }

  const timer = setInterval(() => {
    if (popup.closed) {
      clearInterval(timer);
      onComplete();
    }
  }, 500);
}
