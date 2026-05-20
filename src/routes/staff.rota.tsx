import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Rota from '../features/staff/Rota';

export const Route = createFileRoute('/staff/rota')({
  component: RotaRoute,
});

function RotaRoute() {
  return <Rota />;
}
