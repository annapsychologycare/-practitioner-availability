import { Practitioner } from '../types';
export const KRISTA_NAME='Dr Krista De Castella';
export const INTEGRATION_PRESENTATION='Difficult Psychedelic Experience / Bad-Trip Integration';
export function hasKristaClinicalSpecificity(modalities: string[], presentations: string[], nonComplexEmdrConfirmed: boolean): boolean {
  const ifs=modalities.some(m=>/^Internal Family Systems \(IFS\)/i.test(m));
  const integration=presentations.includes(INTEGRATION_PRESENTATION);
  const emdr=modalities.some(m=>/\(EMDR\)/i.test(m));
  const complex=presentations.some(p=>/complex|dissociat|developmental|childhood/i.test(p));
  return ifs || integration || (emdr && nonComplexEmdrConfirmed && !complex);
}
export function isKristaIndividualEligible(p: Practitioner, sessionType: string, age: number|null, excludeFemaleOnly: boolean): boolean {
  const types=Array.isArray(p.client_types)?p.client_types:[p.client_types];
  return p.name===KRISTA_NAME && !p.referral_only && sessionType==='Individual' && types.includes('Individual') && age!==null && age>=16 && !(excludeFemaleOnly && p.client_gender_accepted==='Female Only');
}
