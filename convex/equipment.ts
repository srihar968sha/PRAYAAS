import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active equipment
export const getAllEquipment = query({
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
      .query("equipment")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get equipment by category
export const getEquipmentByCategory = query({
  args: { category: v.string() },
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

    return await ctx.db
      .query("equipment")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Add new equipment (club members and admin only)
export const addEquipment = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    totalQuantity: v.number(),
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

    const equipmentId = await ctx.db.insert("equipment", {
      name: args.name,
      category: args.category,
      description: args.description,
      totalQuantity: args.totalQuantity,
      availableQuantity: args.totalQuantity,
      isActive: args.isActive !== undefined ? args.isActive : true,
    });

    // Log the action
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: "equipment_added",
      targetId: equipmentId,
      details: `Added equipment: ${args.name} (${args.totalQuantity} units)`,
      timestamp: new Date().toISOString(),
      metadata: {
        equipmentName: args.name,
        quantity: args.totalQuantity,
      },
    });

    return equipmentId;
  },
});

// Update equipment (club members and admin only)
export const updateEquipment = mutation({
  args: {
    equipmentId: v.id("equipment"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    totalQuantity: v.optional(v.number()),
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

    const equipment = await ctx.db.get(args.equipmentId);
    if (!equipment) throw new Error("Equipment not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.category !== undefined) updates.category = args.category;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    
    // Handle quantity updates carefully
    if (args.totalQuantity !== undefined) {
      const difference = args.totalQuantity - equipment.totalQuantity;
      updates.totalQuantity = args.totalQuantity;
      updates.availableQuantity = equipment.availableQuantity + difference;
    }

    await ctx.db.patch(args.equipmentId, updates);

    // Log the action
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: "equipment_updated",
      targetId: args.equipmentId,
      details: `Updated equipment: ${equipment.name}`,
      timestamp: new Date().toISOString(),
      metadata: {
        equipmentName: equipment.name,
      },
    });

    return args.equipmentId;
  },
});

// Get equipment categories
export const getEquipmentCategories = query({
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

    const equipment = await ctx.db
      .query("equipment")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const categories = [...new Set(equipment.map(item => item.category))];
    return categories.sort();
  },
});

// Update equipment availability (internal use)
export const updateEquipmentAvailability = mutation({
  args: {
    equipmentId: v.id("equipment"),
    quantityChange: v.number(), // positive for returns, negative for rentals
  },
  handler: async (ctx, args) => {
    const equipment = await ctx.db.get(args.equipmentId);
    if (!equipment) throw new Error("Equipment not found");

    const newAvailable = equipment.availableQuantity + args.quantityChange;
    
    if (newAvailable < 0) {
      throw new Error("Insufficient equipment available");
    }
    
    if (newAvailable > equipment.totalQuantity) {
      throw new Error("Cannot exceed total quantity");
    }

    await ctx.db.patch(args.equipmentId, {
      availableQuantity: newAvailable,
    });

    return newAvailable;
  },
});
