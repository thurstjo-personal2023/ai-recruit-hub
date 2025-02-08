import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Application, Job } from "@shared/schema";

export default function Profile() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });
  const { data: applications } = useQuery<(Application & { job: Job })[]>({ 
    queryKey: ["/api/applications"],
    enabled: user?.role === "candidate"
  });
  const { data: postedJobs } = useQuery<Job[]>({ 
    queryKey: ["/api/jobs/posted"],
    enabled: user?.role === "employer"
  });

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{user.name}'s Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-lg">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd className="text-lg capitalize">{user.role}</dd>
            </div>
            {user.company && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Company</dt>
                <dd className="text-lg">{user.company}</dd>
              </div>
            )}
            {user.title && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                <dd className="text-lg">{user.title}</dd>
              </div>
            )}
            {user.bio && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Bio</dt>
                <dd className="text-lg">{user.bio}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {user.role === "candidate" && applications && (
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <h3 className="font-medium">{app.job.title}</h3>
                    <p className="text-sm text-muted-foreground">{app.job.company}</p>
                  </div>
                  <div className="capitalize">{app.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === "employer" && postedJobs && (
        <Card>
          <CardHeader>
            <CardTitle>Posted Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {postedJobs.map(job => (
                <div key={job.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  </div>
                  <div className="capitalize">{job.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
