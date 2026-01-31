export function getSubdomain() {
  if (typeof window === "undefined") return "abc";

  const host = window.location.host;

  // Localhost fallback
  if (host.includes("localhost")) return "abc";

  const parts = host.split("."); // admin.zapcart.zapelite.com

  // Always return second subdomain
  return parts.length > 2 ? parts[1] : "abc";
}
