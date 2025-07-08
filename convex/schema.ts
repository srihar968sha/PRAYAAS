import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Extended user profile with role and approval status
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("member"), v.literal("admin")),
    isApproved: v.boolean(),
    studentId: v.optional(v.string()), // For students
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    year: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_role", ["role"])
    .index("by_approval_status", ["isApproved"]),

  // Equipment inventory
  equipment: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    totalQuantity: v.number(),
    availableQuantity: v.number(),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Academic semesters
  semesters: defineTable({
    code: v.string(), // e.g., "W25", "S25"
    name: v.string(), // e.g., "Winter 2025"
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"])
    .index("by_code", ["code"]),

  // Equipment requests from students
  requests: defineTable({
    studentId: v.id("userProfiles"),
    equipmentId: v.id("equipment"),
    semesterId: v.id("semesters"),
    quantity: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reason: v.optional(v.string()), // For rejection or special notes
    requestDate: v.string(), // ISO date string
    reviewedBy: v.optional(v.id("userProfiles")),
    reviewDate: v.optional(v.string()),
  })
    .index("by_student", ["studentId"])
    .index("by_status", ["status"])
    .index("by_equipment", ["equipmentId"])
    .index("by_semester", ["semesterId"]),

  // Active rentals
  rentals: defineTable({
    studentId: v.id("userProfiles"),
    equipmentId: v.id("equipment"),
    semesterId: v.id("semesters"),
    requestId: v.optional(v.id("requests")), // Link to original request
    quantity: v.number(),
    startDate: v.string(), // ISO date string
    dueDate: v.string(), // ISO date string (usually semester end)
    returnDate: v.optional(v.string()),
    lateFee: v.optional(v.number()),
    isReturned: v.boolean(),
    rentedBy: v.id("userProfiles"), // Club member who processed the rental
  })
    .index("by_student", ["studentId"])
    .index("by_equipment", ["equipmentId"])
    .index("by_semester", ["semesterId"])
    .index("by_return_status", ["isReturned"])
    .index("by_due_date", ["dueDate"]),

  // Transaction history log
  transactionLogs: defineTable({
    userId: v.id("userProfiles"), // Who performed the action
    actionType: v.union(
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
    ),
    targetId: v.optional(v.string()), // ID of the affected entity
    details: v.string(), // Human-readable description
    timestamp: v.string(), // ISO date string
    metadata: v.optional(v.object({
      equipmentName: v.optional(v.string()),
      studentName: v.optional(v.string()),
      quantity: v.optional(v.number()),
      lateFee: v.optional(v.number()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_action_type", ["actionType"])
    .index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
