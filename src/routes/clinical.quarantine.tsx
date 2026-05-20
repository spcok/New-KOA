import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Quarantine from '../features/clinical/Quarantine';

export const Route = createFileRoute('/clinical/quarantine')({
  component: QuarantineRoute,
});

function QuarantineRoute() {
  return <Quarantine />;
}
