import { mcpNotAPost, mcpOptions, mcpPost } from "@/lib/mcp/server";

// Same endpoint with the token in the address, for connectors that only take
// a URL (no header field), such as claude.ai's custom connectors.
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return mcpPost(req, token);
}
export const GET = () => mcpNotAPost();
export const DELETE = () => mcpNotAPost();
export const OPTIONS = () => mcpOptions();
