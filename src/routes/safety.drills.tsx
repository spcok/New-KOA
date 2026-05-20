import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import SafetyDrills from '../features/safety/SafetyDrills';

export const Route = createFileRoute('/safety/drills')({
  component: SafetyDrillsRoute,
});

function SafetyDrillsRoute() {
  return <SafetyDrills />;
}
