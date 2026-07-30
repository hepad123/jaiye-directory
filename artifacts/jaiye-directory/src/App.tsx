import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

import HomePage from '@/app/page';
import DirectoryPage from '@/app/directory/page';
import BeautyServicesPage from '@/app/beautyservices/page';
import EventServicesPage from '@/app/eventservices/page';
import OnboardingPage from '@/app/onboarding/page';
import SavedPage from '@/app/saved/page';
import StyleCalendarPage from '@/app/style-calendar/page';
import SignInPage from '@/app/sign-in/[[...sign-in]]/page';
import SignUpPage from '@/app/sign-up/[[...sign-up]]/page';
import EditProfilePage from '@/app/profile/edit/page';
import ProfilePage from '@/app/profile/[username]/page';
import ShortlistPage from '@/app/shortlist/[username]/page';
import ClaimVendorPage from '@/app/vendor/claim/[id]/page';
import VendorDashboardPage from '@/app/vendor/dashboard/[id]/page';
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>Page not found</h2>
        <a href="/" style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none' }}>← Back to directory</a>
      </div>
    </main>
  );
}

// Resets scroll to top on every route change — fixes SPA navigation leaving
// the page mid-scroll from the previous route.
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/directory" component={DirectoryPage} />
        <Route path="/beautyservices" component={BeautyServicesPage} />
        <Route path="/eventservices" component={EventServicesPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/saved" component={SavedPage} />
        <Route path="/style-calendar" component={StyleCalendarPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/profile/edit" component={EditProfilePage} />
        <Route path="/profile/:username" component={ProfilePage} />
        <Route path="/shortlist/:username" component={ShortlistPage} />
        <Route path="/vendor/claim/:id" component={ClaimVendorPage} />
        <Route path="/vendor/dashboard/:id" component={VendorDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
