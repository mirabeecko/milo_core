import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { XPostResult, XSearchResult, XUser } from "./types.js";

const execFileAsync = promisify(execFile);

export class XurlService {
  /**
   * Check if xurl is installed and authenticated.
   */
  async checkStatus(): Promise<{ installed: boolean; authenticated: boolean; user?: string }> {
    try {
      const { stdout } = await execFileAsync("xurl", ["auth", "status"], { timeout: 10_000 });
      const hasOauth = stdout.includes("oauth2:") && !stdout.includes("oauth2: (none)");
      const userMatch = stdout.match(/username:\s*(\S+)/);
      return {
        installed: true,
        authenticated: hasOauth,
        user: userMatch?.[1],
      };
    } catch {
      return { installed: false, authenticated: false };
    }
  }

  /**
   * Post a standalone statement.
   */
  async post(text: string): Promise<XPostResult> {
    const { stdout } = await execFileAsync("xurl", ["post", text], { timeout: 30_000 });
    return JSON.parse(stdout) as XPostResult;
  }

  /**
   * Reply to a post.
   */
  async reply(postId: string, text: string): Promise<XPostResult> {
    const { stdout } = await execFileAsync("xurl", ["reply", postId, text], { timeout: 30_000 });
    return JSON.parse(stdout) as XPostResult;
  }

  /**
   * Quote a post with commentary.
   */
  async quote(postId: string, text: string): Promise<XPostResult> {
    const { stdout } = await execFileAsync("xurl", ["quote", postId, text], { timeout: 30_000 });
    return JSON.parse(stdout) as XPostResult;
  }

  /**
   * Delete a post.
   */
  async delete(postId: string): Promise<void> {
    await execFileAsync("xurl", ["delete", postId], { timeout: 30_000 });
  }

  /**
   * Search posts.
   */
  async search(query: string, count = 10): Promise<XSearchResult> {
    const { stdout } = await execFileAsync("xurl", ["search", query, "-n", String(count)], {
      timeout: 30_000,
    });
    return JSON.parse(stdout) as XSearchResult;
  }

  /**
   * Get the authenticated user info.
   */
  async whoami(): Promise<{ data: XUser }> {
    const { stdout } = await execFileAsync("xurl", ["whoami"], { timeout: 15_000 });
    return JSON.parse(stdout) as { data: XUser };
  }

  /**
   * Look up a user by handle.
   */
  async getUser(handle: string): Promise<{ data: XUser }> {
    const cmd = handle.startsWith("@") ? ["user", handle] : ["user", `@${handle}`];
    const { stdout } = await execFileAsync("xurl", cmd, { timeout: 15_000 });
    return JSON.parse(stdout) as { data: XUser };
  }

  /**
   * Get home timeline.
   */
  async timeline(count = 20): Promise<XSearchResult> {
    const { stdout } = await execFileAsync("xurl", ["timeline", "-n", String(count)], {
      timeout: 30_000,
    });
    return JSON.parse(stdout) as XSearchResult;
  }

  /**
   * Get mentions.
   */
  async mentions(count = 20): Promise<XSearchResult> {
    const { stdout } = await execFileAsync("xurl", ["mentions", "-n", String(count)], {
      timeout: 30_000,
    });
    return JSON.parse(stdout) as XSearchResult;
  }

  /**
   * Upload media and return the media ID.
   */
  async uploadMedia(filePath: string): Promise<{ data: { id: string } }> {
    const { stdout } = await execFileAsync("xurl", ["media", "upload", filePath], {
      timeout: 60_000,
    });
    return JSON.parse(stdout) as { data: { id: string } };
  }

  /**
   * Post with image attachment.
   */
  async postWithMedia(text: string, mediaPath: string): Promise<XPostResult> {
    const uploadResult = await this.uploadMedia(mediaPath);
    const mediaId = uploadResult.data.id;

    // Wait for media processing
    await this.waitForMedia(mediaId);

    const { stdout } = await execFileAsync(
      "xurl",
      ["post", text, "--media-id", mediaId],
      { timeout: 30_000 },
    );
    return JSON.parse(stdout) as XPostResult;
  }

  private async waitForMedia(mediaId: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const { stdout } = await execFileAsync("xurl", ["media", "status", mediaId], {
        timeout: 10_000,
      });
      const result = JSON.parse(stdout) as {
        data?: { processing_info?: { state: string } };
      };
      const state = result.data?.processing_info?.state;
      if (!state || state === "succeeded" || state === "failed") {
        return;
      }
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }

  /**
   * Post a thread of statements.
   */
  async postThread(statements: string[]): Promise<XPostResult[]> {
    const results: XPostResult[] = [];
    let previousId: string | undefined;

    for (const text of statements) {
      const result = previousId
        ? await this.reply(previousId, text)
        : await this.post(text);
      results.push(result);
      previousId = result.data.id;
    }

    return results;
  }
}
