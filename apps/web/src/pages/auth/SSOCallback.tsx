import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

export function SSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      api.setToken(token);
      
      // Mock user data - in real app, decode JWT or fetch user
      setUser({
        id: "user_123",
        email: "user@example.com",
        name: "User",
        role: "user",
      });
      
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>Completing Sign In</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              Please wait while we complete your sign in...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}