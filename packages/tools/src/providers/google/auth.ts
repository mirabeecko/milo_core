import { OAuth2Client } from "google-auth-library";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

export function createGoogleOAuthClient(config: GoogleOAuthConfig): OAuth2Client {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}

export function getAuthorizationUrl(
  oauth2Client: OAuth2Client,
  scopes: string[],
  state?: string,
): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
    state,
  });
}

export async function getTokens(
  oauth2Client: OAuth2Client,
  code: string,
): Promise<{
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export const googleScopes = {
  gmail: ["https://www.googleapis.com/auth/gmail.readonly"],
  calendar: ["https://www.googleapis.com/auth/calendar.readonly"],
  drive: ["https://www.googleapis.com/auth/drive.readonly"],
};
