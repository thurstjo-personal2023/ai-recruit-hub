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
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold text-primary">AIRecruitHub</a>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/jobs">
                <a className={`${location === '/jobs' ? 'text-primary' : ''}`}>Jobs</a>
              </Link>
              <Link href="/profile">
                <a className={`${location === '/profile' ? 'text-primary' : ''}`}>Profile</a>
              </Link>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
