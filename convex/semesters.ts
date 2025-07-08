import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all semesters
export const getAllSemesters = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved) {
      throw new Error("Access denied");
    }

    return await ctx.db.query("semesters").order("desc").collect();
  },
});

// Get active semester
export const getActiveSemester = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved) {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("semesters")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .unique();
  },
});

// Create new semester (club members and admin only)
export const createSemester = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    setAsActive: v.optional(v.boolean()),
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

    // Check if code already exists
    const existingSemester = await ctx.db
      .query("semesters")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existingSemester) {
      throw new Error("Semester code already exists");
    }

    // If setting as active, deactivate other semesters
    if (args.setAsActive) {
      const activeSemesters = await ctx.db
        .query("semesters")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      for (const semester of activeSemesters) {
        await ctx.db.patch(semester._id, { isActive: false });
      }
    }

    const semesterId = await ctx.db.insert("semesters", {
      code: args.code,
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: args.setAsActive || false,
    });

    // Log the action
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: "semester_created",
      targetId: semesterId,
      details: `Created semester: ${args.name} (${args.code})`,
      timestamp: new Date().toISOString(),
    });

    return semesterId;
  },
});

// Update semester (club members and admin only)
export const updateSemester = mutation({
  args: {
    semesterId: v.id("semesters"),
    code: v.optional(v.string()),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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

    const semester = await ctx.db.get(args.semesterId);
    if (!semester) throw new Error("Semester not found");

    // If setting as active, deactivate other semesters
    if (args.isActive === true) {
      const activeSemesters = await ctx.db
        .query("semesters")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      for (const activeSemester of activeSemesters) {
        if (activeSemester._id !== args.semesterId) {
          await ctx.db.patch(activeSemester._id, { isActive: false });
        }
      }
    }

    const updates: any = {};
    if (args.code !== undefined) updates.code = args.code;
    if (args.name !== undefined) updates.name = args.name;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.semesterId, updates);

    return args.semesterId;
  },
});
