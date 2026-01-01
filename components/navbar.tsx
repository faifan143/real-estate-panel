'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Menu, User, LogOut, ChevronDown, Home, FileText, Calendar, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const { role, clearAuth, firstName, lastName, email } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/properties') {
      // Exact match for /properties, or if we're viewing/editing a specific property
      return pathname === '/properties' || (pathname?.startsWith('/properties/') && !pathname?.includes('/my-properties'));
    }
    return pathname?.startsWith(path);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!role) return null;

  const userInitials = firstName 
    ? `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
              ع
            </div>
            <span className="font-bold text-xl hidden md:block text-foreground group-hover:text-primary transition-colors">
              {t('nav.realEstatePanel')}
            </span>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {role === 'ADMIN' ? (
              <>
                <Link href="/admin/requests">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-medium transition-colors ${
                      isActive('/admin/requests') 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                        : ''
                    }`}
                  >
                    {t('nav.adminRequests')}
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-medium transition-colors ${
                      isActive('/properties') 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                        : ''
                    }`}
                  >
                    {t('nav.properties')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/properties">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-medium transition-colors ${
                      isActive('/properties') 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                        : ''
                    }`}
                  >
                    {t('nav.properties')}
                  </Button>
                </Link>
                <Link href="/my-properties">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-medium transition-colors ${
                      isActive('/my-properties') 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                        : ''
                    }`}
                  >
                    {t('nav.myProperties')}
                  </Button>
                </Link>
                <Link href="/my-requests">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-medium transition-colors ${
                      isActive('/my-requests') 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                        : ''
                    }`}
                  >
                    {t('nav.myRequests')}
                  </Button>
                </Link>
                <Link href="/my-meetings">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-medium transition-colors ${
                      isActive('/my-meetings') 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                        : ''
                    }`}
                  >
                    {t('nav.myMeetings')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-3">
            {/* User Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 border-2 border-border rounded-full py-2 px-3 hover:shadow-lg transition-all duration-200 bg-white group"
              >
                <Menu className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userInitials}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-border py-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-foreground">
                      {firstName && lastName ? `${firstName} ${lastName}` : email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('nav.profile')}</span>
                    </Link>

                    {role === 'USER' && (
                      <>
                        <Link
                          href="/my-properties"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('nav.myProperties')}</span>
                        </Link>

                        <Link
                          href="/my-requests"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('nav.myRequests')}</span>
                        </Link>

                        <Link
                          href="/my-meetings"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('nav.myMeetings')}</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors w-full text-right"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('auth.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container mx-auto px-6 py-4 space-y-2">
            {role === 'ADMIN' ? (
              <>
                <Link 
                  href="/admin/requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive('/admin/requests')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {t('nav.adminRequests')}
                </Link>
                <Link 
                  href="/properties"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive('/properties')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {t('nav.properties')}
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/properties"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive('/properties')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {t('nav.properties')}
                </Link>
                <Link 
                  href="/my-properties"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive('/my-properties')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {t('nav.myProperties')}
                </Link>
                <Link 
                  href="/my-requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive('/my-requests')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {t('nav.myRequests')}
                </Link>
                <Link 
                  href="/my-meetings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive('/my-meetings')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {t('nav.myMeetings')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
