import type { User, InsertUser, Company, InsertCompany, Job, InsertJob, Application, InsertApplication } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company methods  
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyByUserId(userId: number): Promise<Company | undefined>;

  // Job methods
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;

  // Application methods
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByCandidate(candidateId: number): Promise<Application[]>;
  getApplicationsByJob(jobId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private currentId: { 
    users: number; 
    companies: number;
    jobs: number;
    applications: number;
  };

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.currentId = { 
      users: 1, 
      companies: 1,
      jobs: 1,
      applications: 1
    };
  }

  // Existing user methods...
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

  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentId.companies++;
    const company: Company = {
      ...insertCompany,
      id,
      createdAt: new Date()
    };
    this.companies.set(id, company);
    return company;
  }

  async getCompanyByUserId(userId: number): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(
      (company) => company.userId === userId
    );
  }

  // Job methods
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.employerId === employerId
    );
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentId.jobs++;
    const job: Job = {
      ...insertJob,
      id,
      status: "draft",
      createdAt: new Date()
    };
    this.jobs.set(id, job);
    return job;
  }

  // Application methods
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByCandidate(candidateId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (app) => app.candidateId === candidateId
    );
  }

  async getApplicationsByJob(jobId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (app) => app.jobId === jobId
    );
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentId.applications++;
    const application: Application = {
      ...insertApplication,
      id,
      status: "pending",
      aiMatchScore: null,
      aiInsights: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.applications.set(id, application);
    return application;
  }
}

export const storage = new MemStorage();