export interface ContactInfo {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
}

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

export const CONTACT_FIELD_LABELS: Record<keyof ContactInfo, string> = {
  fullName: 'full name',
  address: 'street address, city, state ZIP',
  phone: 'phone number',
  email: 'email address',
  linkedin: 'LinkedIn profile',
  github: 'GitHub profile',
};

export const CONTACT_FIELD_EXAMPLES: Partial<Record<keyof ContactInfo, string>> = {
  phone: '123-456-7890',
  email: 'jake@su.edu',
  linkedin: 'linkedin.com/in/jake',
  github: 'github.com/jake',
};

export const REQUIRED_CONTACT_FIELDS: (keyof ContactInfo)[] = [
  'fullName',
  'phone',
  'email',
  'linkedin',
  'github',
];

export function emptyContactInfo(githubUsername?: string): ContactInfo {
  return {
    fullName: '',
    address: '',
    phone: '',
    email: '',
    linkedin: '',
    github: githubUsername ? `github.com/${githubUsername}` : '',
  };
}

export function missingContactFields(contact: Partial<ContactInfo>): (keyof ContactInfo)[] {
  return REQUIRED_CONTACT_FIELDS.filter((field) => !contact[field]?.trim());
}

export function isContactComplete(contact: ContactInfo): boolean {
  return missingContactFields(contact).length === 0;
}

export function mergeContactInfo(
  current: ContactInfo,
  extracted: Partial<ContactInfo>,
): ContactInfo {
  const merged = { ...current };
  for (const key of Object.keys(extracted) as (keyof ContactInfo)[]) {
    const value = extracted[key]?.trim();
    if (value && !merged[key]?.trim()) {
      merged[key] = value;
    }
  }
  return merged;
}
