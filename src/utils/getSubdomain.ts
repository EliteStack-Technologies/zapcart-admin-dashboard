export function getSubdomain() {
  if (typeof window === "undefined") return "abc";

  // Branch Admins and regular clients now have their specific subdomain 
  // saved to localStorage upon login or switching clients. 
  // This explicitly prevents the dashboard from using the wrong domain 
  // when accessed from a centralized admin url.
  const storedDomain = localStorage.getItem("sub_domain_name");
  if (storedDomain) return storedDomain;

  // Fallback to URL parsing if not locally stored
  const host = window.location.host;
  if (host.includes("localhost")) return "abc";
  
  const parts = host.split(".");
  return parts.length > 2 ? parts[1] : "abc";
}
