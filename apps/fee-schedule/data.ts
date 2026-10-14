import { OurFeeEntry, MBSEntry } from './types';

export const OUR_FEES: OurFeeEntry[] = [
  {
    clinicianType: 'Clinical Psychologist',
    bhFee: 275,
    ahFee: 315,
    medicareRebate: 145.25,
    bhGap: 129.75,
    ahGap: 169.75,
    notes: '~50 min session. Medicare rebate requires valid MHTP referral.',
  },
  {
    clinicianType: 'Clinical Psychologist — Krista De Castella only (90 min)',
    bhFee: 345,
    ahFee: null,
    medicareRebate: 149.05,
    bhGap: 195.95,
    ahGap: null,
    notes: '90-minute appointment: $345, Krista only. Her 60-minute appointments remain $275 (standard business-hours fee). Valid MHTP referral required for Medicare rebate. Confirm any after-hours 90-minute fee with admin.',
  },
  {
    clinicianType: 'Registered Psychologist',
    bhFee: 235,
    ahFee: 275,
    medicareRebate: 98.65,
    bhGap: 136.35,
    ahGap: 176.35,
    notes: '~50 min session. Medicare rebate requires valid MHTP referral.',
  },
  {
    clinicianType: 'Mental Health Social Worker',
    bhFee: 235,
    ahFee: 275,
    medicareRebate: 87.25,
    bhGap: 147.75,
    ahGap: 187.75,
    notes: '~50 min session. Medicare rebate requires valid MHTP referral.',
  },
  {
    clinicianType: 'Psychotherapist / Counsellor',
    bhFee: 170,
    ahFee: 190,
    medicareRebate: null,
    bhGap: null,
    ahGap: null,
    notes: '~50 min session. No Medicare rebate available.',
  },
  {
    clinicianType: 'Couples Therapy',
    bhFee: 275,
    ahFee: 275,
    medicareRebate: null,
    bhGap: null,
    ahGap: null,
    notes: '~50 min session. No Medicare rebate. No after-hours surcharge.',
  },
];

export const MBS_ENTRIES: MBSEntry[] = [
  // ── Clinical Psychology – Better Access ──────────────────────────────
  { id: 'cp-ba-ff-30', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '30–50 min', mbsItem: '80000', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'cp-ba-ff-50', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80010', rebate: 149.05, category: 'Better Access', notes: 'Standard item for 50+ min individual sessions' },
  { id: 'cp-ba-th-30', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '30–50 min', mbsItem: '91166', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'cp-ba-th-50', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '91167', rebate: 149.05, category: 'Better Access', notes: '' },
  { id: 'cp-ba-ph-30', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '30–50 min', mbsItem: '91181', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'cp-ba-ph-50', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '50+ min', mbsItem: '91182', rebate: 149.05, category: 'Better Access', notes: '' },
  { id: 'cp-ba-fc-ff-30', clinicianType: 'Clinical Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Face-to-face', duration: '30–50 min', mbsItem: '80002', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'cp-ba-fc-ff-50', clinicianType: 'Clinical Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80012', rebate: 149.05, category: 'Better Access', notes: '' },
  { id: 'cp-ba-fc-th-30', clinicianType: 'Clinical Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Telehealth (video)', duration: '30–50 min', mbsItem: '91168', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'cp-ba-fc-th-50', clinicianType: 'Clinical Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '91171', rebate: 149.05, category: 'Better Access', notes: '' },
  { id: 'cp-ba-oo-30', clinicianType: 'Clinical Psychologist', sessionType: 'Out of Office', deliveryMode: 'Face-to-face', duration: '30–50 min', mbsItem: '80005', rebate: 126.90, category: 'Better Access', notes: '' },
  { id: 'cp-ba-oo-50', clinicianType: 'Clinical Psychologist', sessionType: 'Out of Office', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80015', rebate: 174.35, category: 'Better Access', notes: '' },
  { id: 'cp-ba-grp-60', clinicianType: 'Clinical Psychologist', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '60+ min', mbsItem: '80020', rebate: 37.85, category: 'Better Access', notes: 'Per person' },
  { id: 'cp-ba-grp-90', clinicianType: 'Clinical Psychologist', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '90+ min', mbsItem: '80022', rebate: 51.60, category: 'Better Access', notes: 'Per person' },
  { id: 'cp-ba-grp-120', clinicianType: 'Clinical Psychologist', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '120+ min', mbsItem: '80024', rebate: 70.05, category: 'Better Access', notes: 'Per person' },

  // ── Registered Psychology – Better Access ────────────────────────────
  { id: 'rp-ba-ff-20', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '80100', rebate: 72.00, category: 'Better Access', notes: '' },
  { id: 'rp-ba-ff-50', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80110', rebate: 101.55, category: 'Better Access', notes: 'Standard item for 50+ min individual sessions' },
  { id: 'rp-ba-th-20', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '20–50 min', mbsItem: '91169', rebate: 72.00, category: 'Better Access', notes: '' },
  { id: 'rp-ba-th-50', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '91170', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'rp-ba-ph-20', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '20–50 min', mbsItem: '91183', rebate: 72.00, category: 'Better Access', notes: '' },
  { id: 'rp-ba-ph-50', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '50+ min', mbsItem: '91184', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'rp-ba-fc-ff-20', clinicianType: 'Registered Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '80102', rebate: 72.00, category: 'Better Access', notes: '' },
  { id: 'rp-ba-fc-ff-50', clinicianType: 'Registered Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80112', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'rp-ba-fc-th-20', clinicianType: 'Registered Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Telehealth (video)', duration: '20–50 min', mbsItem: '91174', rebate: 72.00, category: 'Better Access', notes: '' },
  { id: 'rp-ba-fc-th-50', clinicianType: 'Registered Psychologist', sessionType: 'Family & Carer', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '91177', rebate: 101.55, category: 'Better Access', notes: '' },
  { id: 'rp-ba-oo-20', clinicianType: 'Registered Psychologist', sessionType: 'Out of Office', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '80105', rebate: 97.85, category: 'Better Access', notes: '' },
  { id: 'rp-ba-oo-50', clinicianType: 'Registered Psychologist', sessionType: 'Out of Office', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80115', rebate: 127.50, category: 'Better Access', notes: '' },
  { id: 'rp-ba-grp-60', clinicianType: 'Registered Psychologist', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '60+ min', mbsItem: '80120', rebate: 25.90, category: 'Better Access', notes: 'Per person' },
  { id: 'rp-ba-grp-90', clinicianType: 'Registered Psychologist', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '90+ min', mbsItem: '80122', rebate: 35.30, category: 'Better Access', notes: 'Per person' },
  { id: 'rp-ba-grp-120', clinicianType: 'Registered Psychologist', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '120+ min', mbsItem: '80127', rebate: 47.95, category: 'Better Access', notes: 'Per person' },

  // ── Mental Health Social Worker – Better Access ──────────────────────
  // AMHSW (Accredited Mental Health Social Worker, AASW) use the 80150–80175 series
  // — DIFFERENT item numbers and LOWER rebates than Registered Psychologists
  // Rebates verified directly on MBS Online (Jul 2025 schedule fee):
  //   80150 = $61.80, 91187 = $61.80, 91188 = $87.25, 91176 = $87.25
  { id: 'sw-ba-ff-20', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '80150', rebate: 61.80, category: 'Better Access', notes: 'In consulting rooms. AMHSW only (AASW accredited).' },
  { id: 'sw-ba-ff-50', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80152', rebate: 87.25, category: 'Better Access', notes: 'In consulting rooms. Standard item for 50+ min sessions.' },
  { id: 'sw-ba-th-20', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '20–50 min', mbsItem: '91175', rebate: 61.80, category: 'Better Access', notes: 'AMHSW video FPS item.' },
  { id: 'sw-ba-th-50', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '91176', rebate: 87.25, category: 'Better Access', notes: 'Verified: MBS fee $102.60, 85% benefit = $87.25.' },
  { id: 'sw-ba-ph-20', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '20–50 min', mbsItem: '91187', rebate: 61.80, category: 'Better Access', notes: 'Verified: MBS fee $72.65, 85% benefit = $61.80.' },
  { id: 'sw-ba-ph-50', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '50+ min', mbsItem: '91188', rebate: 87.25, category: 'Better Access', notes: 'Verified: MBS fee $102.60, 85% benefit = $87.25.' },
  { id: 'sw-ba-fc-ff-20', clinicianType: 'Mental Health Social Worker', sessionType: 'Family & Carer', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '80154', rebate: 61.80, category: 'Better Access', notes: 'Up to 2 family/carer sessions per calendar year.' },
  { id: 'sw-ba-fc-ff-50', clinicianType: 'Mental Health Social Worker', sessionType: 'Family & Carer', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80156', rebate: 87.25, category: 'Better Access', notes: '' },
  { id: 'sw-ba-oo-20', clinicianType: 'Mental Health Social Worker', sessionType: 'Out of Office', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '80160', rebate: 82.55, category: 'Better Access', notes: 'Outside of consulting rooms.' },
  { id: 'sw-ba-oo-50', clinicianType: 'Mental Health Social Worker', sessionType: 'Out of Office', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '80165', rebate: 113.65, category: 'Better Access', notes: 'Outside of consulting rooms.' },
  { id: 'sw-ba-grp-60', clinicianType: 'Mental Health Social Worker', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '60+ min', mbsItem: '80170', rebate: 21.50, category: 'Better Access', notes: 'Per person. Up to 10 group sessions per year.' },
  { id: 'sw-ba-grp-90', clinicianType: 'Mental Health Social Worker', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '90+ min', mbsItem: '80172', rebate: 29.30, category: 'Better Access', notes: 'Per person.' },
  { id: 'sw-ba-grp-120', clinicianType: 'Mental Health Social Worker', sessionType: 'Group', deliveryMode: 'Face-to-face', duration: '120+ min', mbsItem: '80174', rebate: 39.80, category: 'Better Access', notes: 'Per person.' },

  // ── CDMP (Chronic Disease Management Plan) ────────────────────────────
  // Up to 5 individual allied health sessions per calendar year under GP CDMP
  // Requires: GP chronic condition management plan (replaced old EPC/TCA from 1 Jul 2025)
  { id: 'cdmp-cp-ff', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '20+ min', mbsItem: '10968', rebate: 63.40, category: 'CDMP', notes: 'GP Chronic Disease Management Plan required. Max 5 sessions/year.' },
  { id: 'cdmp-cp-th', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '20+ min', mbsItem: '93000', rebate: 63.40, category: 'CDMP', notes: 'GP CDMP required. Max 5 sessions/year.' },
  { id: 'cdmp-cp-ph', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '20+ min', mbsItem: '93013', rebate: 63.40, category: 'CDMP', notes: 'GP CDMP required. Max 5 sessions/year.' },
  { id: 'cdmp-rp-ff', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '20+ min', mbsItem: '10968', rebate: 63.40, category: 'CDMP', notes: 'GP Chronic Disease Management Plan required. Max 5 sessions/year.' },
  { id: 'cdmp-rp-th', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '20+ min', mbsItem: '93000', rebate: 63.40, category: 'CDMP', notes: 'GP CDMP required. Max 5 sessions/year.' },
  { id: 'cdmp-rp-ph', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telephone', duration: '20+ min', mbsItem: '93013', rebate: 63.40, category: 'CDMP', notes: 'GP CDMP required. Max 5 sessions/year.' },
  { id: 'cdmp-sw-ff', clinicianType: 'Mental Health Social Worker', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '20+ min', mbsItem: '10970', rebate: 63.40, category: 'CDMP', notes: 'GP CDMP required. AMHSW item. Max 5 sessions/year.' },

  // ── Eating Disorder Items ─────────────────────────────────────────────
  { id: 'cp-ed-ff-30', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '30–50 min', mbsItem: '82352', rebate: 101.55, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'cp-ed-ff-50', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '82355', rebate: 149.05, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'cp-ed-th-30', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '30–50 min', mbsItem: '93076', rebate: 101.55, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'cp-ed-th-50', clinicianType: 'Clinical Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '93079', rebate: 149.05, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'rp-ed-ff-20', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '20–50 min', mbsItem: '82360', rebate: 72.00, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'rp-ed-ff-50', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Face-to-face', duration: '50+ min', mbsItem: '82363', rebate: 101.55, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'rp-ed-th-20', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '20–50 min', mbsItem: '93084', rebate: 72.00, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
  { id: 'rp-ed-th-50', clinicianType: 'Registered Psychologist', sessionType: 'Individual', deliveryMode: 'Telehealth (video)', duration: '50+ min', mbsItem: '93087', rebate: 101.55, category: 'Eating Disorder', notes: 'Eating Disorder Plan required' },
];
