import { mcpNotAPost, mcpOptions, mcpPost } from "@/lib/mcp/server";

// MCP endpoint for clients that can send an Authorization: Bearer header
// (Claude Code, Grok / xAI API, MCP Inspector, ...).
export const POST = (req: Request) => mcpPost(req);
export const GET = () => mcpNotAPost();
export const DELETE = () => mcpNotAPost();
export const OPTIONS = () => mcpOptions();
