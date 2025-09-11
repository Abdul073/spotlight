import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getNotification = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const notification = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
      .order("desc")
      .collect();

    const notificationWithInfo = await Promise.all(
      notification.map(async (notification) => {
        const sender = (await ctx.db.get(notification.senderId))!;
        const post = notification.postId
          ? await ctx.db.get(notification.postId)
          : null;
        const commentDoc =
          notification.type === "comment" && notification.commentId
            ? await ctx.db.get(notification.commentId)
            : null;

        return {
          ...notification,
          sender: {
            _id: sender._id,
            username: sender.username,
            image: sender.image,
          },
          post,
          comment: commentDoc?.content,
        };
      })
    );
    return notificationWithInfo;
  },
});
