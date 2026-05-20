import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Reports from '../features/admin/Reports';

export const Route = createFileRoute('/admin/reports')({
  component: ReportsRoute,
});

function ReportsRoute() {
  return <Reports />;
}
