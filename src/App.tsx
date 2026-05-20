import React from 'react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { useAuthStore } from './store/authStore';

// Import the generated route tree layout configuration
import { routeTree } from './routeTree.gen';

// 1. Instantiation matching TanStack v1+ compilation rules
const router = createRouter({
  routeTree,
  context: {
    auth: undefined, // Will be bound dynamically inside the injection block below
  },
});

// Explicit registration parameters for TypeScript compiler typing engine coverage
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  // 2. Extract state dynamically to avoid stale snapshots across browser hot-reloads
  const authState = useAuthStore();

  return (
    <RouterProvider 
      router={router} 
      context={{ auth: authState }} 
    />
  );
}