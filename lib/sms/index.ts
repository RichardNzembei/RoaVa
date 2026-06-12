import "server-only";

import { serverEnv } from "@/lib/env";

export interface SmsProvider {
  readonly name: string;
  send(toE164: string, message: string): Promise<{ ok: boolean }>;
}

// Africa's Talking transactional SMS (CLAUDE.md §2). Best-effort; verify the
// endpoint/fields against AT docs before relying on it in production.
class AfricasTalkingProvider implements SmsProvider {
  readonly name = "africastalking";

  async send(toE164: string, message: string): Promise<{ ok: boolean }> {
    try {
      const res = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          apiKey: serverEnv.africasTalking.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          username: serverEnv.africasTalking.username,
          to: toE164,
          message,
          ...(serverEnv.africasTalking.senderId
            ? { from: serverEnv.africasTalking.senderId }
            : {}),
        }),
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }
}

// Dev fallback — logs instead of sending, so the flow is testable without creds.
class LogSmsProvider implements SmsProvider {
  readonly name = "log";
  async send(toE164: string, message: string): Promise<{ ok: boolean }> {
    console.log(`[sms:log] → ${toE164}: ${message}`);
    return { ok: true };
  }
}

export function getSmsProvider(): SmsProvider {
  const { username, apiKey } = serverEnv.africasTalking;
  return username && apiKey ? new AfricasTalkingProvider() : new LogSmsProvider();
}
