import { pgTable, text, serial, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for job titles and communication preferences
export const JobTitle = {
  TALENT_ACQUISITION_MANAGER: "Talent Acquisition Manager",
  HR_DIRECTOR: "HR Director",
  CEO: "CEO",
  OTHER: "Other"
} as const;

export const CommunicationPreference = {
  EMAIL: "email",
  SMS: "sms",
  PLATFORM: "platform"
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["employer", "candidate"] }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number"),
  jobTitle: text("job_title", { 
    enum: Object.values(JobTitle) 
  }),
  linkedinUrl: text("linkedin_url"),
  profilePicture: text("profile_picture"),
  communicationPreference: text("communication_preference", { 
    enum: Object.values(CommunicationPreference) 
  }).notNull().default("email"),
  company: text("company"),
  bio: text("bio")
});

// Properly handle optional fields in user schema
export const insertUserSchema = createInsertSchema(users, {
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format").optional().nullable(),
  profilePicture: z.string().url("Invalid profile picture URL").optional().nullable(),
  company: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  jobTitle: z.enum(Object.values(JobTitle) as [string, ...string[]]).optional(),
  communicationPreference: z.enum(Object.values(CommunicationPreference) as [string, ...string[]]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).omit({ id: true });

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  location: text("location").notNull(),
  employerId: integer("employer_id").notNull(),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  aiScore: jsonb("ai_score")
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  aiMatch: jsonb("ai_match")
});

export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  createdAt: true, 
  aiScore: true,
  status: true 
});

export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true, 
  createdAt: true, 
  aiMatch: true,
  status: true 
});

export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;