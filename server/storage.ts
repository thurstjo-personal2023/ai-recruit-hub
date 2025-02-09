import type { User, InsertUser, Job, InsertJob, Application, InsertApplication } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getJobs(): Promise<Job[]>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  getApplicationsByCandidate(candidateId: number): Promise<(Application & { job: Job })[]>;
  createApplication(application: InsertApplication): Promise<Application>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private currentId: { users: number; jobs: number; applications: number };

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.currentId = { users: 1, jobs: 1, applications: 1 };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = {
      ...insertUser,
      id,
      company: insertUser.company ?? null,
      title: insertUser.title ?? null,
      bio: insertUser.bio ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.employerId === employerId,
    );
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentId.jobs++;
    const job: Job = {
      ...insertJob,
      id,
      status: "open",
      createdAt: new Date(),
      aiScore: { score: Math.floor(Math.random() * 100) }
    };
    this.jobs.set(id, job);
    return job;
  }

  async getApplicationsByCandidate(candidateId: number): Promise<(Application & { job: Job })[]> {
    return Array.from(this.applications.values())
      .filter((app) => app.candidateId === candidateId)
      .map((app) => ({
        ...app,
        job: this.jobs.get(app.jobId)!
      }));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentId.applications++;
    const application: Application = {
      ...insertApplication,
      id,
      status: "pending",
      createdAt: new Date(),
      aiMatch: { score: Math.floor(Math.random() * 100) }
    };
    this.applications.set(id, application);
    return application;
  }
}

export const storage = new MemStorage();