import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold text-primary">AIRecruitHub</a>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <a className="text-foreground/80 hover:text-foreground">Browse Jobs</a>
          </Link>
          
          {user ? (
            <>
              <Link href="/jobs/post">
                <Button>Post a Job</Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => auth.signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
