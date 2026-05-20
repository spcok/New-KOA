import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import ZlaCompliance from '../features/staff/ZlaCompliance';

export const Route = createFileRoute('/staff/zla')({
  component: ZlaComplianceRoute,
});

function ZlaComplianceRoute() {
  return <ZlaCompliance />;
}
