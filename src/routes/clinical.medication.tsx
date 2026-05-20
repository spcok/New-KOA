import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Medication from '../features/clinical/Medication';

export const Route = createFileRoute('/clinical/medication')({
  component: MedicationRoute,
});

function MedicationRoute() {
  return <Medication />;
}
