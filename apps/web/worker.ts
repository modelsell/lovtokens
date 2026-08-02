import openNextWorker from "./.open-next/worker.js";

const worker = {
  fetch: openNextWorker.fetch,
  async scheduled(_: ScheduledController, env: CloudflareEnv, context: ExecutionContext) {
    if (!env.CRON_SECRET) return;
    const request = new Request("https://lovtokens.internal/api/cron/refresh", {
      method: "POST",
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    context.waitUntil(openNextWorker.fetch(request, env, context));
  },
};

export default worker;
