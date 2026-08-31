import "@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from feexpay-webhook Function!");

Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ status: "ok", message: "Webhook endpoint ready" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
