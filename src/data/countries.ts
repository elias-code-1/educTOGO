export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  {
    code: 'TG',
    name: 'Togo',
    dialCode: '+228',
    flag: '🇹🇬',
  },
  // Pour ajouter un nouveau pays plus tard, il suffit d'ajouter une entrée ici :
  // { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
  // { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮' },
  // { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

/**
 * Concatène l'indicatif du pays et les chiffres locaux sans double signe plus.
 */
export function buildInternationalPhone(dialCode: string, localPhone: string): string {
  const cleanDigits = (localPhone || '').replace(/\D/g, '');
  const cleanDialCode = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const dialDigits = cleanDialCode.replace('+', '');

  // Si l'utilisateur a collé un numéro qui commence déjà par l'indicatif numérique
  if (cleanDigits.startsWith(dialDigits)) {
    return `+${cleanDigits}`;
  }

  return `${cleanDialCode}${cleanDigits}`;
}
