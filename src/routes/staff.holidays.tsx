import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Holidays from '../features/staff/Holidays';

export const Route = createFileRoute('/staff/holidays')({
  component: HolidaysRoute,
});

function HolidaysRoute() {
  return <Holidays />;
}
