import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Submit equipment request (students only)
export const submitRequest = mutation({
  args: {
    equipmentId: v.id("equipment"),
    quantity: v.number(),
    semesterId: v.id("semesters"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved || profile.role !== "student") {
      throw new Error("Student access required");
    }

    // Verify equipment exists and has sufficient quantity
    const equipment = await ctx.db.get(args.equipmentId);
    if (!equipment || !equipment.isActive) {
      throw new Error("Equipment not found or inactive");
    }

    if (equipment.availableQuantity < args.quantity) {
      throw new Error("Insufficient equipment available");
    }

    // Verify session exists and is active
    const semester = await ctx.db.get(args.semesterId);
    if (!semester || !semester.isActive) {
      throw new Error("Invalid or inactive session. Please contact the club admin to activate a session.");
    }

    // Check for existing pending request for same equipment
    const existingRequest = await ctx.db
      .query("requests")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("equipmentId"), args.equipmentId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("You already have a pending request for this equipment");
    }

    const requestId = await ctx.db.insert("requests", {
      studentId: profile._id,
      equipmentId: args.equipmentId,
      semesterId: args.semesterId,
      quantity: args.quantity,
      status: "pending",
      requestDate: new Date().toISOString(),
    });

    // Log the action
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: "request_submitted",
      targetId: requestId,
      details: `Submitted request for ${args.quantity}x ${equipment.name}`,
      timestamp: new Date().toISOString(),
      metadata: {
        equipmentName: equipment.name,
        studentName: profile.name,
        quantity: args.quantity,
      },
    });

    return requestId;
  },
});

// Get student's requests
export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved || profile.role !== "student") {
      throw new Error("Student access required");
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .order("desc")
      .collect();

    // Enrich with equipment and semester details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const equipment = await ctx.db.get(request.equipmentId);
        const semester = await ctx.db.get(request.semesterId);
        const reviewer = request.reviewedBy ? await ctx.db.get(request.reviewedBy) : null;

        return {
          ...request,
          equipment,
          semester,
          reviewer,
        };
      })
    );

    return enrichedRequests;
  },
});

// Get all pending requests (club members and admin)
export const getPendingRequests = query({
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

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Enrich with student, equipment, and semester details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const student = await ctx.db.get(request.studentId);
        const equipment = await ctx.db.get(request.equipmentId);
        const semester = await ctx.db.get(request.semesterId);
        const reviewer = request.reviewedBy ? await ctx.db.get(request.reviewedBy) : null;

        return {
          ...request,
          student,
          equipment,
          semester,
          reviewer,
        };
      })
    );

    return enrichedRequests;
  },
});

// Get all requests (club members and admin)
export const getAllRequests = query({
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

    const requests = await ctx.db
      .query("requests")
      .order("desc")
      .collect();

    // Enrich with student, equipment, and semester details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const student = await ctx.db.get(request.studentId);
        const equipment = await ctx.db.get(request.equipmentId);
        const semester = await ctx.db.get(request.semesterId);
        const reviewer = request.reviewedBy ? await ctx.db.get(request.reviewedBy) : null;

        return {
          ...request,
          student,
          equipment,
          semester,
          reviewer,
        };
      })
    );

    return enrichedRequests;
  },
});

// Approve or reject request (club members and admin)
export const reviewRequest = mutation({
  args: {
    requestId: v.id("requests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reason: v.optional(v.string()),
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

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    if (request.status !== "pending") {
      throw new Error("Request has already been reviewed");
    }

    // If approving, check equipment availability and create rental
    if (args.status === "approved") {
      const equipment = await ctx.db.get(request.equipmentId);
      if (!equipment || equipment.availableQuantity < request.quantity) {
        throw new Error("Insufficient equipment available");
      }

      const semester = await ctx.db.get(request.semesterId);
      if (!semester) throw new Error("Semester not found");

      // Update equipment availability
      await ctx.db.patch(request.equipmentId, {
        availableQuantity: equipment.availableQuantity - request.quantity,
      });

      // Create rental record
      await ctx.db.insert("rentals", {
        studentId: request.studentId,
        equipmentId: request.equipmentId,
        semesterId: request.semesterId,
        requestId: args.requestId,
        quantity: request.quantity,
        startDate: new Date().toISOString(),
        dueDate: semester.endDate,
        isReturned: false,
        rentedBy: profile._id,
      });

      // Log equipment rental
      const student = await ctx.db.get(request.studentId);
      await ctx.db.insert("transactionLogs", {
        userId: profile._id,
        actionType: "equipment_rented",
        targetId: args.requestId,
        details: `Rented ${request.quantity}x ${equipment.name} to ${student?.name}`,
        timestamp: new Date().toISOString(),
        metadata: {
          equipmentName: equipment.name,
          studentName: student?.name,
          quantity: request.quantity,
        },
      });
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: args.status,
      reason: args.reason,
      reviewedBy: profile._id,
      reviewDate: new Date().toISOString(),
    });

    // Log the review action
    const student = await ctx.db.get(request.studentId);
    const equipment = await ctx.db.get(request.equipmentId);
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: args.status === "approved" ? "request_approved" : "request_rejected",
      targetId: args.requestId,
      details: `${args.status === "approved" ? "Approved" : "Rejected"} request from ${student?.name} for ${equipment?.name}${args.reason ? `: ${args.reason}` : ""}`,
      timestamp: new Date().toISOString(),
      metadata: {
        equipmentName: equipment?.name,
        studentName: student?.name,
        quantity: request.quantity,
      },
    });

    return args.requestId;
  },
});

// Get pending requests count
export const getPendingRequestsCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isApproved || profile.role === "student") {
      return 0;
    }

    const pendingRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pendingRequests.length;
  },
});
