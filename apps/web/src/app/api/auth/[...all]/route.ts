import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

async function handler(request: Request) { const auth = await getAuth(); const routes = toNextJsHandler(auth); return request.method === "GET" ? routes.GET(request) : routes.POST(request); }
export { handler as GET, handler as POST };
