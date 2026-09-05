import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Subscribe } from './pages/Subscribe';
import { MySubscription } from './pages/MySubscription';
import { OwnerGate } from './pages/owner/OwnerShell';
import { Loading } from './components/ui';

// Owner screens are a separate chunk — customers never download them.
const OwnerHome = lazy(() => import('./pages/owner/Home').then((m) => ({ default: m.OwnerHome })));
const OwnerCook = lazy(() => import('./pages/owner/Cook').then((m) => ({ default: m.OwnerCook })));
const OwnerToday = lazy(() => import('./pages/owner/Today').then((m) => ({ default: m.OwnerToday })));
const OwnerSubscribers = lazy(() =>
  import('./pages/owner/Subscribers').then((m) => ({ default: m.OwnerSubscribers })),
);
const OwnerAddSubscriber = lazy(() =>
  import('./pages/owner/AddSubscriber').then((m) => ({ default: m.OwnerAddSubscriber })),
);
const OwnerRenewals = lazy(() =>
  import('./pages/owner/Renewals').then((m) => ({ default: m.OwnerRenewals })),
);

function Owner({ children }: { children: React.ReactNode }) {
  return (
    <OwnerGate>
      <Suspense fallback={<Loading label="Loading…" />}>{children}</Suspense>
    </OwnerGate>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/my" element={<MySubscription />} />

      <Route path="/owner" element={<Owner><OwnerHome /></Owner>} />
      <Route path="/owner/cook" element={<Owner><OwnerCook /></Owner>} />
      <Route path="/owner/today" element={<Owner><OwnerToday /></Owner>} />
      <Route path="/owner/subscribers" element={<Owner><OwnerSubscribers /></Owner>} />
      <Route path="/owner/add" element={<Owner><OwnerAddSubscriber /></Owner>} />
      <Route path="/owner/renewals" element={<Owner><OwnerRenewals /></Owner>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
