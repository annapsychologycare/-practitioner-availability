export type Location = {
  location: string;
  availability: string | string[];
};

export type Practitioner = {
  id: number;
  name: string;
  title: string;
  fees: string;
  medicare_rebate: string;
  gender: string;
  alert: string;
  presentations: string;
  modalities: string;
  client_types: string;
  age_range: string;
  therapist_type: string;
  pronouns: string;
  billing_types: string;
  languages: string;
  pap_clinician: string;
  after_hours: string;
  religions_groups: string;
  link_to_bio: string;
  bio: string;
  qualifications: string;
  last_updated: string;
  locations: Location[];
  accepts_couples?: boolean;
  short_bio?: string;
  availability?: Array<{ location: string; weekly: string[]; fortnightly: string[]; monthly?: string[] }>;
  additional_info?: string;
  spare_time?: string;
  telehealth?: boolean;
};
