import {useEffect, useState} from 'react';
import {availabilityHorizon, cachedWindowCompatible} from './availabilityHorizon';
import {AVAILABILITY_IMPORT_WINDOW} from '../practitionersData';
/** Tick/focus ensures an open tab switches at Melbourne midnight, not just reload. */
export function useAvailabilityPolicy() {
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const update=()=>setNow(new Date());const id=setInterval(update,1000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(id);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
  const policy=availabilityHorizon(now), compatible=cachedWindowCompatible(AVAILABILITY_IMPORT_WINDOW,now);
  return {...policy,now,compatible,description:`Current policy: ${policy.label} horizon (${policy.from.slice(0,10)}–${policy.to.slice(0,10)}, Melbourne). Cached source window: ${AVAILABILITY_IMPORT_WINDOW.from.slice(0,10)}–${AVAILABILITY_IMPORT_WINDOW.to.slice(0,10)} (${AVAILABILITY_IMPORT_WINDOW.days/7} weeks).${compatible?' Source is cached, not live; see last refreshed timestamp.':' Horizon changed: cached slots withheld until a fresh compatible import; no recurrence extrapolation.'}`};
}
