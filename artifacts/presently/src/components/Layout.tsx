import { Link, useLocation } from "wouter";
import { Home, BarChart2, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Check-in" },
    { href: "/insights", icon: BarChart2, label: "Insights" },
    { href: "/community", icon: Heart, label: "Community" },
  ];

  // Don't show bottom nav on the share screen for a more immersive experience
  const isShareScreen = location.startsWith("/share");

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-transparent">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isShareScreen && (
        <nav className="fixed bottom-0 w-full max-w-md mx-auto glass-panel pb-safe">
          <div className="flex justify-around items-center px-6 py-4">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href} className="relative group p-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "p-2.5 rounded-2xl transition-all duration-300",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-110" 
                        : "text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 bg-primary rounded-full -translate-x-1/2"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
