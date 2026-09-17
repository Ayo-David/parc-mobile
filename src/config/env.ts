function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
}

export const env = {
  apiBaseUrl: required("EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL),
  tenantSlug: required("EXPO_PUBLIC_TENANT_SLUG", process.env.EXPO_PUBLIC_TENANT_SLUG),
};
