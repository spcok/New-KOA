import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import ClinicalRecords from '../features/clinical/ClinicalRecords';

export const Route = createFileRoute('/clinical/records')({
  component: ClinicalRecordsRoute,
});

function ClinicalRecordsRoute() {
  return <ClinicalRecords />;
}
