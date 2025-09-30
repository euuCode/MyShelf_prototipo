import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
      <div className="container mx-auto h-16 flex items-center justify-between">
        <Link to={user ? "/" : "/auth"} className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-extrabold">M</div>
          <span>MyShelf</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/library" label="Minha Biblioteca" />
              <NavItem to="/recommendations" label="Recomendações" />
              <NavItem to="/profile" label="Meu Perfil" />
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-muted-foreground">Olá, {user.name.split(" ")[0]}</span>
              <Button variant="outline" size="sm" onClick={logout}>Sair</Button>
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
