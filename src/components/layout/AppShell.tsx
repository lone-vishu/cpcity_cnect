import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  Search,
  BookOpen,
  User,
  GraduationCap,
  Users,
  Compass,
  FileText,
  Award,
  Layers,
  Settings,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  LogOut,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { APP_CONFIG } from '../../config/app.config';
import { SyntheticBanner } from '../common/SyntheticBanner';
import { notificationService, systemService } from '../../services';
import { NotificationItem, Role } from '../../domain/types';
import { useToast } from '../common/Toast';
import { formatDate } from '../../lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export const AppShell: React.FC = () => {
  const { currentUser, currentRole, switchRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('cc_dark_mode') === 'true';
  });

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cc_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cc_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // Load notifications
  useEffect(() => {
    if (currentUser?.id) {
      notificationService.getNotifications(currentUser.id).then(setNotifications);
    }
  }, [currentUser]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (currentUser?.id) {
      await notificationService.markAllAsRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleResetSeed = async () => {
    if (confirm('Reset entire system data back to the initial synthetic demonstration seed?')) {
      await systemService.resetDatabase();
      showToast('System data reset successfully', 'success');
      window.location.reload();
    }
  };

  // Role-specific navigation items
  const getNavItems = (): NavItem[] => {
    if (currentRole === 'trainee') {
      return [
        { label: 'My Dashboard', href: '/trainee/dashboard', icon: <Compass className="h-4 w-4" /> },
        { label: 'Course Catalogue', href: '/courses', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'My Learning', href: '/trainee/my-courses', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Assessments', href: '/trainee/assessments', icon: <FileText className="h-4 w-4" /> },
        { label: 'Certificates (Demo)', href: '/certificates', icon: <Award className="h-4 w-4" /> },
        { label: 'My Profile', href: '/trainee/profile', icon: <User className="h-4 w-4" /> },
        { label: 'Announcements', href: '/announcements', icon: <Bell className="h-4 w-4" /> },
      ];
    }
    if (currentRole === 'trainer') {
      return [
        { label: 'Trainer Dashboard', href: '/trainer/dashboard', icon: <Compass className="h-4 w-4" /> },
        { label: 'My Courses & Cohorts', href: '/trainer/courses', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Trainer Library', href: '/trainer/library', icon: <Layers className="h-4 w-4" /> },
        { label: 'Assessment Builder', href: '/trainer/assessments', icon: <FileText className="h-4 w-4" /> },
        { label: 'Competency Profile', href: '/trainer/profile', icon: <User className="h-4 w-4" /> },
        { label: 'Course Catalogue', href: '/courses', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Announcements', href: '/announcements', icon: <Bell className="h-4 w-4" /> },
      ];
    }
    // Admin
    return [
      { label: 'Executive Dashboard', href: '/admin/dashboard', icon: <Compass className="h-4 w-4" /> },
      { label: 'User Management', href: '/admin/users', icon: <Users className="h-4 w-4" />, badge: '3 Pending' },
      { label: 'Course Approvals', href: '/admin/courses', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Training Needs & Matching', href: '/admin/needs', icon: <Sparkles className="h-4 w-4 text-amber-500" /> },
      { label: 'Competency Catalogue', href: '/admin/competencies', icon: <Layers className="h-4 w-4" /> },
      { label: 'Evidence Verification', href: '/admin/verification', icon: <ShieldCheck className="h-4 w-4" /> },
      { label: 'Announcements & News', href: '/admin/announcements', icon: <Bell className="h-4 w-4" /> },
      { label: 'Reports & Analytics', href: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
      { label: 'Audit Trail', href: '/admin/audit', icon: <FileText className="h-4 w-4" /> },
      { label: 'System Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* 1. Synthetic Data Banner */}
      <SyntheticBanner />

      {/* 2. Top Header Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 no-print">
        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden focus-ring"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 focus-ring rounded-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white font-black shadow-sm">
              CC
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
                Capacity<span className="text-teal-600 dark:text-teal-400">Connect</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
                IMD Training Prototype
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleGlobalSearch} className="w-full relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search courses, resources, competencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:focus:bg-slate-900"
            />
          </form>
        </div>

        {/* Right: Role Switcher, Notification Bell, Theme Toggle, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill */}
          <div className="hidden sm:flex items-center rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            {(['trainee', 'trainer', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={async () => {
                  await switchRole(r);
                  showToast(`Active role: ${r.toUpperCase()}`, 'info');
                  if (r === 'admin') navigate('/admin/dashboard');
                  else if (r === 'trainer') navigate('/trainer/dashboard');
                  else navigate('/trainee/dashboard');
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                  currentRole === r
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 focus-ring"
            title="Toggle theme"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 focus-ring"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          if (n.link) navigate(n.link);
                          setIsNotificationsOpen(false);
                        }}
                        className={`cursor-pointer p-2.5 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          !n.read ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0 mt-1" />}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                        <span className="mt-1.5 block text-[10px] text-slate-400">{formatDate(n.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu or Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pl-2 text-left hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 focus-ring"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-teal-600">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 pr-1" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in duration-150">
                  <div className="border-b px-3 py-2.5 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300 capitalize">
                      Active: {currentUser.role}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (currentRole === 'trainee') navigate('/trainee/profile');
                        else if (currentRole === 'trainer') navigate('/trainer/profile');
                        else navigate('/admin/dashboard');
                        setIsUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={handleResetSeed}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Demo Data</span>
                    </button>
                  </div>

                  <div className="border-t pt-1 dark:border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 3. Main Body: Sidebar + Main Content Area */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4 shrink-0 no-print">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Navigation ({currentRole?.toUpperCase()})
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Help Box in Sidebar */}
          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <HelpCircle className="h-4 w-4 text-teal-600" />
              <span>Capacity Connect</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Digital Capacity Building & Competency-Based Trainer Discovery.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-72 bg-white p-4 shadow-xl dark:bg-slate-900 h-full flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Capacity Connect</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Role Switch */}
              <div className="my-3 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Switch Demo Role</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['trainee', 'trainer', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={async () => {
                        await switchRole(r);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`rounded py-1 text-xs font-medium capitalize ${
                        currentRole === r ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
