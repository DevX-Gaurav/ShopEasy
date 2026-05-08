import { Link } from "react-router-dom";
import { ShoppingBag, Mail, Phone, Instagram, Twitter, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary text-secondary-foreground">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-sunset text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">shopeasy</span>
          </div>
          <p className="mt-3 text-sm text-secondary-foreground/70">
            A modern multi-vendor marketplace celebrating independent makers worldwide.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a className="rounded-md p-2 hover:bg-secondary-foreground/10" href="#" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a className="rounded-md p-2 hover:bg-secondary-foreground/10" href="#" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
            <a className="rounded-md p-2 hover:bg-secondary-foreground/10" href="#" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FooterCol title="Shop">
          <FooterLink to="/category/Electronics">Electronics</FooterLink>
          <FooterLink to="/category/Fashion">Fashion</FooterLink>
          <FooterLink to="/category/Footwear">Footwear</FooterLink>
          <FooterLink to="/shop">All products</FooterLink>
        </FooterCol>

        <FooterCol title="Account">
          <FooterLink to="/auth/login">Log in</FooterLink>
          <FooterLink to="/auth/signup">Sign up</FooterLink>
          <FooterLink to="/orders">My orders</FooterLink>
          <FooterLink to="/cart">Cart</FooterLink>
        </FooterCol>

        <FooterCol title="Support">
          <li className="flex items-center gap-2 text-sm text-secondary-foreground/70">
            <Mail className="h-3.5 w-3.5" /> hello@shopeasy.com
          </li>
          <li className="flex items-center gap-2 text-sm text-secondary-foreground/70">
            <Phone className="h-3.5 w-3.5" /> +91 1800-123-456
          </li>
          <FooterLink to="/contact">Contact</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-secondary-foreground/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-secondary-foreground/60 sm:flex-row">
          <div>© {new Date().getFullYear()} ShopEasy. All rights reserved.</div>
          <div>Burnt Sunset & Slate · Demo build</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/80">{title}</h4>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground">
        {children}
      </Link>
    </li>
  );
}