import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user's profile
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return { user, profile };
  },
});

// Create user profile after registration
export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("member")),
    name: v.string(),
    studentId: v.optional(v.string()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    year: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check if this is the first user (becomes admin)
    const existingProfiles = await ctx.db.query("userProfiles").collect();
    const isFirstUser = existingProfiles.length === 0;
    
    const role = isFirstUser ? "admin" : args.role;
    const isApproved = isFirstUser; // First user is auto-approved as admin

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      role,
      isApproved,
      name: args.name,
      email: user.email || "",
      studentId: args.studentId,
      phone: args.phone,
      department: args.department,
      year: args.year,
    });

    // Log the action
    await ctx.db.insert("transactionLogs", {
      userId: profileId,
      actionType: isFirstUser ? "user_approved" : "request_submitted",
      details: isFirstUser 
        ? `Admin account created for ${args.name}`
        : `${args.role} registration submitted for ${args.name}`,
      timestamp: new Date().toISOString(),
    });

    return profileId;
  },
});

// Get pending user approvals (admin only)
export const getPendingUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_approval_status", (q) => q.eq("isApproved", false))
      .collect();
  },
});

// Approve or reject user (admin only)
export const updateUserApproval = mutation({
  args: {
    profileId: v.id("userProfiles"),
    isApproved: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) throw new Error("User profile not found");

    await ctx.db.patch(args.profileId, {
      isApproved: args.isApproved,
    });

    // Log the action
    await ctx.db.insert("transactionLogs", {
      userId: currentProfile._id,
      actionType: args.isApproved ? "user_approved" : "user_rejected",
      targetId: args.profileId,
      details: `${args.isApproved ? "Approved" : "Rejected"} ${targetProfile.role} ${targetProfile.name}${args.reason ? `: ${args.reason}` : ""}`,
      timestamp: new Date().toISOString(),
    });

    return args.profileId;
  },
});

// Get all approved users (for admin management)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_approval_status", (q) => q.eq("isApproved", true))
      .collect();
  },
});
