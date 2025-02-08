import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertJobSchema, insertApplicationSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/auth/register", async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const user = await storage.createUser(result.data);
    req.session.userId = user.id;
    res.json(user);
  });

  // Jobs routes
  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/posted", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const jobs = await storage.getJobsByEmployer(req.session.userId);
    res.json(jobs);
  });

  app.post("/api/jobs", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = insertJobSchema.safeParse({
      ...req.body,
      employerId: req.session.userId
    });
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const job = await storage.createJob(result.data);
    res.json(job);
  });

  // Applications routes
  app.get("/api/applications", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const applications = await storage.getApplicationsByCandidate(req.session.userId);
    res.json(applications);
  });

  app.post("/api/applications", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = insertApplicationSchema.safeParse({
      ...req.body,
      candidateId: req.session.userId
    });
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const application = await storage.createApplication(result.data);
    res.json(application);
  });

  const httpServer = createServer(app);
  return httpServer;
}
