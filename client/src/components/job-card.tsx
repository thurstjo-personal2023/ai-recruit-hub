import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Sparkles } from "lucide-react";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: number) => void;
  showApply?: boolean;
}

export function JobCard({ job, onApply, showApply = true }: JobCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{job.title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Building2 className="w-4 h-4" />
              <span>{job.company}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          </div>
          {job.aiScore && (
            <div className="flex items-center gap-1 text-primary">
              <Sparkles className="w-4 h-4" />
              <span>AI Match: {(job.aiScore as any).score}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{job.description}</p>
      </CardContent>
      {showApply && (
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => onApply?.(job.id)}
          >
            Apply Now
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
