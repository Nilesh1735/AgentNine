const restrictedCountries = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU",
  "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
  "GB", "CH",
  "AX", "GF", "GP", "MF", "MQ", "RE", "YT",
]);

export function isRestrictedCountry(countryCode: string | null | undefined) {
  return countryCode ? restrictedCountries.has(countryCode.toUpperCase()) : false;
}
