export type AcademicClasse = 'Seconde' | 'Première' | 'Terminale';
export type AcademicFiliere = 'Général' | 'Technique';

export interface AcademicSerie {
  code: string;
  label: string; // Intitulé court entre parenthèses ex: "Scientifique combiné", "Littéraire"
  category?: 'scientifique' | 'litteraire' | 'industriel' | 'tertiaire';
}

export interface ClasseOption {
  id: AcademicClasse;
  label: string;
  badge: string;
  description: string;
}

export interface FiliereOption {
  id: AcademicFiliere;
  label: string;
  badge: string;
  description: string;
}

export const CLASSES: ClasseOption[] = [
  {
    id: 'Seconde',
    label: 'Seconde',
    badge: '2nde',
    description: 'Cycle de détermination et fondamentaux du lycée',
  },
  {
    id: 'Première',
    label: 'Première',
    badge: '1ère',
    description: 'Spécialisation et préparation au probatoire / bac 1',
  },
  {
    id: 'Terminale',
    label: 'Terminale',
    badge: 'Tle',
    description: 'Année du Baccalauréat et orientation supérieure',
  },
];

export const FILIERES: FiliereOption[] = [
  {
    id: 'Général',
    label: 'Général',
    badge: 'Enseignement Général',
    description: 'Filières littéraires et scientifiques',
  },
  {
    id: 'Technique',
    label: 'Technique',
    badge: 'Enseignement Technique',
    description: 'Filières industrielles et sciences de gestion',
  },
];

/**
 * Retourne la liste exacte des séries autorisées selon la classe et la filière
 */
export function getSeriesForSelection(
  classe: AcademicClasse | null,
  filiere: AcademicFiliere | null
): AcademicSerie[] {
  if (!classe || !filiere) return [];

  // Si filière Général
  if (filiere === 'Général') {
    if (classe === 'Seconde') {
      return [
        {
          code: 'CD',
          label: 'Scientifique combiné',
          category: 'scientifique',
        },
        {
          code: 'A4',
          label: 'Littéraire',
          category: 'litteraire',
        },
      ];
    } else {
      // Première ou Terminale
      return [
        {
          code: 'A4',
          label: 'Littéraire',
          category: 'litteraire',
        },
        {
          code: 'C',
          label: 'Mathématiques & Sciences Physiques',
          category: 'scientifique',
        },
        {
          code: 'D',
          label: 'Sciences de la Vie et de la Terre',
          category: 'scientifique',
        },
      ];
    }
  }

  // Si filière Technique, quelle que soit la classe : E, F1, F2, F3, F4, Ti, G1, G2 et G3
  if (filiere === 'Technique') {
    return [
      {
        code: 'E',
        label: 'Mathématiques et Technique',
        category: 'industriel',
      },
      {
        code: 'F1',
        label: 'Fabrication mécanique',
        category: 'industriel',
      },
      {
        code: 'F2',
        label: 'Électronique',
        category: 'industriel',
      },
      {
        code: 'F3',
        label: 'Électrotechnique',
        category: 'industriel',
      },
      {
        code: 'F4',
        label: 'Génie civil et Bâtiment',
        category: 'industriel',
      },
      {
        code: 'Ti',
        label: 'Techniques industrielles / Informatique',
        category: 'industriel',
      },
      {
        code: 'G1',
        label: 'Secrétariat et Bureautique',
        category: 'tertiaire',
      },
      {
        code: 'G2',
        label: 'Comptabilité et Gestion',
        category: 'tertiaire',
      },
      {
        code: 'G3',
        label: 'Commerce et Mercatique',
        category: 'tertiaire',
      },
    ];
  }

  return [];
}
