import React, { useEffect } from 'react';
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { Login } from '../features/auth/Login';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { SyncEngine } from '../components/data/SyncEngine';

// 1. Define the exact context interface boundary
interface RouterContext {
  auth?: ReturnType<typeof useAuthStore.getState>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    // 2. Strict defensive check to prevent early evaluation context drops
    const currentSession = context?.auth?.session;
    
    if (!currentSession && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  // STRICT SELECTORS LAW: Atomic slice optimization
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session = useAuthStore((s) => s.session);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0A0B0E] text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <>
      <SyncEngine />
      <AppLayout />
    </>
  );
}