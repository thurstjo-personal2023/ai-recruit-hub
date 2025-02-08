import { Navbar } from "@/components/layout/navbar";
import { JobForm } from "@/components/jobs/job-form";

export default function NewJobPage() {
  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>
          <div className="max-w-2xl">
            <JobForm />
          </div>
        </div>
      </main>
    </div>
  );
}
