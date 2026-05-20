import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Maintenance from '../features/safety/Maintenance';

export const Route = createFileRoute('/safety/maintenance')({
  component: MaintenanceRoute,
});

function MaintenanceRoute() {
  return <Maintenance />;
}
