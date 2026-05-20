import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Timesheets from '../features/staff/Timesheets';

export const Route = createFileRoute('/staff/timesheets')({
  component: TimesheetsRoute,
});

function TimesheetsRoute() {
  return <Timesheets />;
}
