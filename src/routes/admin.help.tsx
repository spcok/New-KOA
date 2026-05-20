import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Help from '../features/admin/Help';

export const Route = createFileRoute('/admin/help')({
  component: HelpRoute,
});

function HelpRoute() {
  return <Help />;
}
