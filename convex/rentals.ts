import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get student's active rentals
export const getMyRentals = query({
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

    const rentals = await ctx.db
      .query("rentals")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .order("desc")
      .collect();

    // Enrich with equipment and semester details
    const enrichedRentals = await Promise.all(
      rentals.map(async (rental) => {
        const equipment = await ctx.db.get(rental.equipmentId);
        const semester = await ctx.db.get(rental.semesterId);
        const rentedBy = await ctx.db.get(rental.rentedBy);

        // Calculate if overdue and late fee
        const now = new Date();
        const dueDate = new Date(rental.dueDate);
        const isOverdue = !rental.isReturned && now > dueDate;
        const overdueDays = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const lateFee = overdueDays * 10; // ₹10 per day

        return {
          ...rental,
          equipment,
          semester,
          rentedBy,
          isOverdue,
          overdueDays,
          calculatedLateFee: lateFee,
        };
      })
    );

    return enrichedRentals;
  },
});

// Get all rentals (club members and admin)
export const getAllRentals = query({
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

    const rentals = await ctx.db
      .query("rentals")
      .order("desc")
      .collect();

    // Enrich with student, equipment, and semester details
    const enrichedRentals = await Promise.all(
      rentals.map(async (rental) => {
        const student = await ctx.db.get(rental.studentId);
        const equipment = await ctx.db.get(rental.equipmentId);
        const semester = await ctx.db.get(rental.semesterId);
        const rentedBy = await ctx.db.get(rental.rentedBy);

        // Calculate if overdue and late fee
        const now = new Date();
        const dueDate = new Date(rental.dueDate);
        const isOverdue = !rental.isReturned && now > dueDate;
        const overdueDays = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const lateFee = overdueDays * 10; // ₹10 per day

        return {
          ...rental,
          student,
          equipment,
          semester,
          rentedBy,
          isOverdue,
          overdueDays,
          calculatedLateFee: lateFee,
        };
      })
    );

    return enrichedRentals;
  },
});

// Get overdue rentals (club members and admin)
export const getOverdueRentals = query({
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

    const activeRentals = await ctx.db
      .query("rentals")
      .withIndex("by_return_status", (q) => q.eq("isReturned", false))
      .collect();

    const now = new Date();
    const overdueRentals = activeRentals.filter(rental => {
      const dueDate = new Date(rental.dueDate);
      return now > dueDate;
    });

    // Enrich with student, equipment, and semester details
    const enrichedRentals = await Promise.all(
      overdueRentals.map(async (rental) => {
        const student = await ctx.db.get(rental.studentId);
        const equipment = await ctx.db.get(rental.equipmentId);
        const semester = await ctx.db.get(rental.semesterId);
        const rentedBy = await ctx.db.get(rental.rentedBy);

        const dueDate = new Date(rental.dueDate);
        const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const lateFee = overdueDays * 10; // ₹10 per day

        return {
          ...rental,
          student,
          equipment,
          semester,
          rentedBy,
          isOverdue: true,
          overdueDays,
          calculatedLateFee: lateFee,
        };
      })
    );

    return enrichedRentals.sort((a, b) => b.overdueDays - a.overdueDays);
  },
});

// Return equipment (club members and admin)
export const returnEquipment = mutation({
  args: {
    rentalId: v.id("rentals"),
    lateFee: v.optional(v.number()),
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

    const rental = await ctx.db.get(args.rentalId);
    if (!rental) throw new Error("Rental not found");

    if (rental.isReturned) {
      throw new Error("Equipment already returned");
    }

    // Update equipment availability
    const equipment = await ctx.db.get(rental.equipmentId);
    if (equipment) {
      await ctx.db.patch(rental.equipmentId, {
        availableQuantity: equipment.availableQuantity + rental.quantity,
      });
    }

    // Update rental record
    await ctx.db.patch(args.rentalId, {
      isReturned: true,
      returnDate: new Date().toISOString(),
      lateFee: args.lateFee || 0,
    });

    // Log the return
    const student = await ctx.db.get(rental.studentId);
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: "equipment_returned",
      targetId: args.rentalId,
      details: `Returned ${rental.quantity}x ${equipment?.name} from ${student?.name}${args.lateFee ? ` (Late fee: ₹${args.lateFee})` : ""}`,
      timestamp: new Date().toISOString(),
      metadata: {
        equipmentName: equipment?.name,
        studentName: student?.name,
        quantity: rental.quantity,
        lateFee: args.lateFee,
      },
    });

    return args.rentalId;
  },
});

// Get overdue rentals count
export const getOverdueRentalsCount = query({
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

    const activeRentals = await ctx.db
      .query("rentals")
      .withIndex("by_return_status", (q) => q.eq("isReturned", false))
      .collect();

    const now = new Date();
    const overdueCount = activeRentals.filter(rental => {
      const dueDate = new Date(rental.dueDate);
      return now > dueDate;
    }).length;

    return overdueCount;
  },
});

// Create direct rental (club members and admin)
export const createDirectRental = mutation({
  args: {
    studentId: v.id("userProfiles"),
    equipmentId: v.id("equipment"),
    semesterId: v.id("semesters"),
    quantity: v.number(),
    customDueDate: v.optional(v.string()),
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

    // Verify student exists and is approved
    const student = await ctx.db.get(args.studentId);
    if (!student || !student.isApproved || student.role !== "student") {
      throw new Error("Invalid student");
    }

    // Verify equipment exists and has sufficient quantity
    const equipment = await ctx.db.get(args.equipmentId);
    if (!equipment || !equipment.isActive || equipment.availableQuantity < args.quantity) {
      throw new Error("Insufficient equipment available");
    }

    // Verify semester exists
    const semester = await ctx.db.get(args.semesterId);
    if (!semester) throw new Error("Semester not found");

    // Update equipment availability
    await ctx.db.patch(args.equipmentId, {
      availableQuantity: equipment.availableQuantity - args.quantity,
    });

    // Create rental record
    const rentalId = await ctx.db.insert("rentals", {
      studentId: args.studentId,
      equipmentId: args.equipmentId,
      semesterId: args.semesterId,
      quantity: args.quantity,
      startDate: new Date().toISOString(),
      dueDate: args.customDueDate || semester.endDate,
      isReturned: false,
      rentedBy: profile._id,
    });

    // Log the rental
    await ctx.db.insert("transactionLogs", {
      userId: profile._id,
      actionType: "equipment_rented",
      targetId: rentalId,
      details: `Direct rental: ${args.quantity}x ${equipment.name} to ${student.name}`,
      timestamp: new Date().toISOString(),
      metadata: {
        equipmentName: equipment.name,
        studentName: student.name,
        quantity: args.quantity,
      },
    });

    return rentalId;
  },
});
