import React from 'react';
import {activeUpcomingLeave, UpcomingLeaveFields} from '../utils/upcomingLeave';
import {useNoticeClock} from '../utils/useNoticeClock';
import {suppressKristaIntake} from '../utils/practitionerIntakePause';
export const UpcomingLeave: React.FC<{practitioner: UpcomingLeaveFields & {name?: string}}> = ({practitioner}) => {
  const now = useNoticeClock();
  const text = activeUpcomingLeave(suppressKristaIntake(practitioner), new Date(now));
  return text ? <section className="alert alert-info my-2 block" aria-label="Upcoming leave"><strong>Upcoming leave — client notice</strong><div className="whitespace-pre-line">{text}</div></section> : null;
};
