import { pgTable, text, serial, timestamp, boolean, jsonb, integer, array } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["employer", "candidate"] }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profilePicture: text("profile_picture"),
  phoneNumber: text("phone_number"),
  jobTitle: text("job_title").notNull(),
  linkedinUrl: text("linkedin_url"),
  yearsOfExperience: integer("years_of_experience"),
  industryExpertise: text("industry_expertise").array(),
  recruitmentSpecialization: text("recruitment_specialization").array(),
  atsUsed: text("ats_used"),
  hiringChallenges: text("hiring_challenges").array(),
  preferredCommunication: text("preferred_communication", { 
    enum: ["email", "sms", "in_platform"] 
  }).notNull(),
  notificationPreferences: jsonb("notification_preferences"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  logo: text("logo"),
  industry: text("industry").notNull(),
  size: text("size").notNull(),
  headquartersCountry: text("headquarters_country").notNull(),
  headquartersCity: text("headquarters_city").notNull(),
  annualOpenRoles: integer("annual_open_roles"),
  hiringTypes: text("hiring_types").array(),
  hiringPriorities: text("hiring_priorities").array(),
  talentSourcingChannels: text("talent_sourcing_channels").array(),
  useAiJobDescription: boolean("use_ai_job_description").default(true),
  useAiPersona: boolean("use_ai_persona").default(true),
  requiredSkills: text("required_skills").array(),
  languagePreferences: text("language_preferences").array(),
  salaryRangeMin: integer("salary_range_min"),
  salaryRangeMax: integer("salary_range_max"),
  perksAndBenefits: text("perks_and_benefits").array(),
  customizeEmployerBranding: boolean("customize_employer_branding").default(false),
  companyVideo: text("company_video"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull()
});

// Handle optional and array fields in user schema
export const insertUserSchema = createInsertSchema(users, {
  industryExpertise: z.array(z.string()).min(1, "Select at least one industry"),
  recruitmentSpecialization: z.array(z.string()).min(1, "Select at least one specialization"),
  hiringChallenges: z.array(z.string()),
  notificationPreferences: z.object({
    jobMatches: z.boolean(),
    aiInsights: z.boolean(),
    candidateUpdates: z.boolean()
  }),
  profilePicture: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
  atsUsed: z.string().optional(),
  phoneNumber: z.string().optional()
}).omit({ 
  id: true,
  createdAt: true,
  mfaEnabled: true,
  emailVerified: true
});

export const insertCompanySchema = createInsertSchema(companies, {
  hiringTypes: z.array(z.string()).min(1, "Select at least one hiring type"),
  hiringPriorities: z.array(z.string()).min(1, "Select at least one priority"),
  talentSourcingChannels: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  languagePreferences: z.array(z.string()),
  perksAndBenefits: z.array(z.string()),
  website: z.string().url("Invalid website URL").optional(),
  logo: z.string().optional(),
  companyVideo: z.string().optional(),
  salaryRangeMin: z.number().optional(),
  salaryRangeMax: z.number().optional()
}).omit({ 
  id: true, 
  createdAt: true,
  userId: true
});

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;