import { HttpRouter } from "convex/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = new HttpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET ENV");
    }

    const svid_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svid_id || !svix_signature || !svix_timestamp) {
      return new Response("Error occured -- no svix header", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);

    let evt: any;

    // verify webhook
    try {
      evt = wh.verify(body, {
        "svix-id": svid_id,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as any;
    } catch (error) {
      console.log("Error verifying webhook", error);
      return new Response("Error occured", { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.createUser, {
          email,
          fullname: name,
          image: image_url,
          clerkId: id,
          username: email.split("@")[0],
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    return new Response("Webhook processed successfullt", { status: 200 });
  }),
});

export default http;
