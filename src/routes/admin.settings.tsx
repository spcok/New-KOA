import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Settings from '../features/admin/Settings';

export const Route = createFileRoute('/admin/settings')({
  component: SettingsRoute,
});

function SettingsRoute() {
  return <Settings />;
}
