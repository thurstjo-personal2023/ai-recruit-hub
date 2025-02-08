import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#0057B8] to-[#00C0F1] bg-clip-text text-transparent">
            AI-Powered Hiring Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect with top talent and opportunities using advanced AI matching technology
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" size="lg">Browse Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
