import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Job } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: Job;
  onApply?: () => void;
  showApply?: boolean;
}

export function JobCard({ job, onApply, showApply = true }: JobCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <p className="text-muted-foreground">{job.company}</p>
          </div>
          {showApply && (
            <Button onClick={onApply}>Apply Now</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">{job.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.salary}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
