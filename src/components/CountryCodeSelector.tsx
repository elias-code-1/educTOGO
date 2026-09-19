import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Country, COUNTRIES } from '../data/countries';

interface CountryCodeSelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  countries?: Country[];
  disabled?: boolean;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  selectedCountry,
  onSelectCountry,
  countries = COUNTRIES,
  disabled = false,
}) => {
  return (
    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
      <div className="relative flex items-center">
        {/* Affichage visuel du drapeau, indicatif et chevron */}
        <div className="flex items-center gap-1 text-gray-800 font-semibold text-sm select-none pointer-events-none">
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-sm font-semibold tracking-tight text-gray-800 ml-0.5">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown size={14} className="text-gray-400 ml-0.5 shrink-0" />
        </div>

        {/* Élément select HTML superposé pour le comportement de liste déroulante natif accessible */}
        <select
          aria-label="Sélectionner l'indicatif du pays"
          disabled={disabled}
          value={selectedCountry.code}
          onChange={(e) => {
            const country = countries.find((c) => c.code === e.target.value);
            if (country) {
              onSelectCountry(country);
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* Séparateur vertical fin */}
      <div className="w-px h-4 bg-gray-300 ml-2.5 mr-1" />
    </div>
  );
};

export default CountryCodeSelector;
