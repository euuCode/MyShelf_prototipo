import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
      <div className="container mx-auto h-16 flex items-center justify-between">
        <Link to={user ? "/" : "/auth"} className="flex items-center gap-2 font-bold text-lg">
          <img src="https://cdn.builder.io/api/v1/image/assets%2F3c8a0a5812c44b06be8fd0e2f1e4ec7f%2F10132834169e442eaef59abebd423bd2?format=webp&width=96" alt="MyShelf" className="h-8 w-auto" />
          <span className="hidden sm:inline">MyShelf</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/library" label="Minha Biblioteca" />
              <NavItem to="/recommendations" label="Recomendações" />
              <NavItem to="/settings" label="Configurações" />
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-muted-foreground">Olá, {user.name.split(" ")[0]}</span>
              <Button variant="outline" size="sm" onClick={logout} className="hidden md:inline-flex">Sair</Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    <NavItem to="/" label="Home" />
                    <NavItem to="/library" label="Minha Biblioteca" />
                    <NavItem to="/recommendations" label="Recomendações" />
                    <NavItem to="/settings" label="Configurações" />
                    <Button variant="outline" onClick={logout}>Sair</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
          isActive && "text-foreground",
        )
      }
    >
      {label}
    </NavLink>
  );
}
