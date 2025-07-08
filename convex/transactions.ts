import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get transaction history (club members and admin)
export const getTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
    actionType: v.optional(v.union(
      v.literal("request_submitted"),
      v.literal("request_approved"),
      v.literal("request_rejected"),
      v.literal("equipment_rented"),
      v.literal("equipment_returned"),
      v.literal("user_approved"),
      v.literal("user_rejected"),
      v.literal("equipment_added"),
      v.literal("equipment_updated"),
      v.literal("semester_created")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved || profile.role === "student") {
      throw new Error("Club member access required");
    }

    const transactions = args.actionType
      ? await ctx.db
          .query("transactionLogs")
          .withIndex("by_action_type", (q) => q.eq("actionType", args.actionType!))
          .order("desc")
          .take(args.limit || 100)
      : await ctx.db
          .query("transactionLogs")
          .withIndex("by_timestamp")
          .order("desc")
          .take(args.limit || 100);

    // Enrich with user details
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await ctx.db.get(transaction.userId);
        return {
          ...transaction,
          user,
        };
      })
    );

    return enrichedTransactions;
  },
});

// Get user's own transaction history (students can see their own)
export const getMyTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved) {
      throw new Error("Access denied");
    }

    const transactions = await ctx.db
      .query("transactionLogs")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

// Get dashboard statistics (club members and admin)
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved || profile.role === "student") {
      throw new Error("Club member access required");
    }

    // Get counts for various entities
    const [
      totalEquipment,
      activeRentals,
      pendingRequests,
      overdueRentals,
      totalStudents,
      pendingUsers,
    ] = await Promise.all([
      ctx.db.query("equipment").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
      ctx.db.query("rentals").withIndex("by_return_status", (q) => q.eq("isReturned", false)).collect(),
      ctx.db.query("requests").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
      ctx.db.query("rentals").withIndex("by_return_status", (q) => q.eq("isReturned", false)).collect(),
      ctx.db.query("userProfiles").withIndex("by_role", (q) => q.eq("role", "student")).filter((q) => q.eq(q.field("isApproved"), true)).collect(),
      ctx.db.query("userProfiles").withIndex("by_approval_status", (q) => q.eq("isApproved", false)).collect(),
    ]);

    // Calculate overdue rentals
    const now = new Date();
    const overdueCount = overdueRentals.filter(rental => {
      const dueDate = new Date(rental.dueDate);
      return now > dueDate;
    }).length;

    return {
      totalEquipment: totalEquipment.length,
      activeRentals: activeRentals.length,
      pendingRequests: pendingRequests.length,
      overdueRentals: overdueCount,
      totalStudents: totalStudents.length,
      pendingUsers: pendingUsers.length,
    };
  },
});
