import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function Navbar() {
  const [location] = useLocation();
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"]
  });

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <nav className="border-b bg-background relative h-16">
      {/* Left side - Logo */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Link href="/">
          <div className="flex items-center">
            <img 
              src="/AIRecruitHub-Logo_v2_1.png" 
              alt="AIRecruitHub Logo" 
              className="h-8 w-auto"
            />
            <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-[#0057B8] to-[#00C0F1] bg-clip-text text-transparent">
              AIRecruitHub
            </span>
          </div>
        </Link>
      </div>

      {/* Right side - Navigation */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-6">
        {user ? (
          <>
            <Link href="/jobs" className="hover:text-[#00C0F1] transition-colors">
              Jobs
            </Link>
            <Link href="/profile" className="hover:text-[#00C0F1] transition-colors">
              Profile
            </Link>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="hover:border-[#00C0F1] hover:text-[#00C0F1]"
            >
              Logout
            </Button>
          </>
        ) : (
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-[#0057B8] to-[#00C0F1] hover:opacity-90">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}