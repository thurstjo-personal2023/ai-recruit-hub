import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, Sparkles, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#0057B8] to-[#00C0F1] bg-clip-text text-transparent">
            AI-Powered Hiring Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Connect with top talent and opportunities using advanced AI matching technology
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <Sparkles className="w-12 h-12 mb-4 text-[#00C0F1] mx-auto" />
              <h3 className="text-lg font-semibold mb-2">AI Matching</h3>
              <p className="text-sm text-muted-foreground">
                Smart algorithms to find your perfect match
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <Building2 className="w-12 h-12 mb-4 text-[#0057B8] mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Top Companies</h3>
              <p className="text-sm text-muted-foreground">
                Connect with leading employers
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 mb-4 text-[#FF8D3F] mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Expert Talent</h3>
              <p className="text-sm text-muted-foreground">
                Access skilled professionals
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-[#0057B8] to-[#00C0F1] hover:opacity-90">
                Get Started
              </Button>
            </Link>
            <Link href="/jobs">
              <Button 
                variant="outline" 
                size="lg"
                className="hover:border-[#00C0F1] hover:text-[#00C0F1]"
              >
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}