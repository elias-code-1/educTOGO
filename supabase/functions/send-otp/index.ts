import "@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from send-otp Function!");

Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ status: "ok", message: "OTP endpoint ready" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
