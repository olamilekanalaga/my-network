import { createClient } from "@supabase/supabase-js";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
let client: ReturnType<typeof createClient> | null = null;
let googleToken: string | null = null;
export const getGoogleToken = () => googleToken;
export function browserDb() {
  if (!configured())
    throw new Error(
      "Supabase is not configured. Use demo mode or add environment variables.",
    );
  if (client) return client;
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem(key) {
            return typeof window !== "undefined"
              ? localStorage.getItem(key)
              : null;
          },
          setItem(key, value) {
            if (typeof window === "undefined") return;
            try {
              const parsed = JSON.parse(value);
              delete parsed.provider_token;
              delete parsed.provider_refresh_token;
              localStorage.setItem(key, JSON.stringify(parsed));
            } catch {
              localStorage.setItem(key, value);
            }
          },
          removeItem(key) {
            if (typeof window !== "undefined") localStorage.removeItem(key);
          },
        },
      },
    },
  );
  client.auth.onAuthStateChange((event, session) => {
    if (session?.provider_token) googleToken = session.provider_token;
    if (event === "SIGNED_OUT") googleToken = null;
  });
  return client;
}
