/** @typedef {{ value: string, label: string, searchText?: string }} SelectOption */

/**
 * ISO 3166-1 alpha-2 codes. Do not use Intl.supportedValuesOf("region") —
 * it throws RangeError in Node and most browsers.
 */
const ISO_COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW",
  "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT",
  "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS",
  "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
];

/** @returns {SelectOption[]} */
function fallbackCountryOptions() {
  return ISO_COUNTRY_CODES.map((code) => ({
    value: code,
    label: code,
    searchText: code.toLowerCase(),
  }));
}

function formatTimezoneLabel(zone) {
  const label = zone.replace(/_/g, " ");
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    });
    const offset = formatter.formatToParts(new Date()).find((part) => part.type === "timeZoneName")
      ?.value;
    return offset ? `${label} (${offset})` : label;
  } catch {
    return label;
  }
}

/** @returns {SelectOption[]} */
export function buildTimezoneOptions() {
  try {
    if (typeof Intl?.supportedValuesOf !== "function") return [];
    return Intl.supportedValuesOf("timeZone")
      .map((zone) => {
        const label = formatTimezoneLabel(zone);
        return {
          value: zone,
          label,
          searchText: `${zone} ${label}`.toLowerCase(),
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
  } catch {
    return [];
  }
}

/** @returns {SelectOption[]} */
export function buildCountryOptions() {
  try {
    let display = null;
    try {
      display = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      display = null;
    }

    return ISO_COUNTRY_CODES.map((code) => {
      let name = code;
      try {
        name = display?.of(code) ?? code;
      } catch {
        name = code;
      }
      return {
        value: code,
        label: name,
        searchText: `${code} ${name}`.toLowerCase(),
      };
    }).sort((left, right) => left.label.localeCompare(right.label));
  } catch {
    return fallbackCountryOptions();
  }
}

let cachedTimezoneOptions = null;
let cachedCountryOptions = null;

/** Lazy — safe to call from forms; never throws. */
export function getTimezoneOptions() {
  if (!cachedTimezoneOptions) {
    cachedTimezoneOptions = buildTimezoneOptions();
  }
  return cachedTimezoneOptions;
}

/** Lazy — safe to call from forms; never throws. */
export function getCountryOptions() {
  if (!cachedCountryOptions) {
    cachedCountryOptions = buildCountryOptions();
  }
  return cachedCountryOptions;
}

/** Raw IANA zone ids for callers that expect a string array. */
export function getTimezoneValues() {
  return getTimezoneOptions().map((option) => option.value);
}

const emptyAddressForm = () => ({
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
});

let cscPromise = null;

/** Lazy-load country / state / city dataset (~used on address forms only). */
function loadCountryStateCity() {
  if (!cscPromise) {
    cscPromise = import("country-state-city");
  }
  return cscPromise;
}

/** @param {Array<{ id?: string, name: string }>} industries */
export function buildIndustryOptions(industries = []) {
  return industries
    .map((industry) => ({
      value: industry.name,
      label: industry.name,
      searchText: industry.name.toLowerCase(),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

/** @param {string | null | undefined} countryCode */
export async function getStateOptions(countryCode) {
  if (!countryCode) return [];
  const { State } = await loadCountryStateCity();
  return State.getStatesOfCountry(countryCode)
    .map((state) => ({
      value: state.isoCode,
      label: state.name,
      searchText: `${state.name} ${state.isoCode}`.toLowerCase(),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

/** @param {string | null | undefined} countryCode @param {string | null | undefined} stateCode */
export async function getCityOptions(countryCode, stateCode) {
  if (!countryCode) return [];
  const { City } = await loadCountryStateCity();
  const rows = stateCode
    ? City.getCitiesOfState(countryCode, stateCode)
    : City.getCitiesOfCountry(countryCode);
  return rows
    .map((city) => ({
      value: city.name,
      label: city.name,
      searchText: city.name.toLowerCase(),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

/** @param {string | null | undefined} countryCode */
export async function countryHasStates(countryCode) {
  if (!countryCode) return false;
  const states = await getStateOptions(countryCode);
  return states.length > 0;
}

/** @param {string | null | undefined} value */
function findCountryCode(value) {
  if (!value) return "";
  const needle = String(value).trim();
  if (!needle) return "";
  const byCode = getCountryOptions().find(
    (option) => option.value.toUpperCase() === needle.toUpperCase(),
  );
  if (byCode) return byCode.value;
  const byName = getCountryOptions().find(
    (option) => option.label.toLowerCase() === needle.toLowerCase(),
  );
  return byName?.value ?? "";
}

/** @param {string} countryCode @param {string | null | undefined} value */
async function findStateCode(countryCode, value) {
  if (!countryCode || !value) return "";
  const needle = String(value).trim();
  if (!needle) return "";
  const states = await getStateOptions(countryCode);
  const byCode = states.find((option) => option.value.toUpperCase() === needle.toUpperCase());
  if (byCode) return byCode.value;
  const byName = states.find((option) => option.label.toLowerCase() === needle.toLowerCase());
  return byName?.value ?? "";
}

/** @param {string} countryCode @param {string} stateCode @param {string | null | undefined} value */
async function findCityValue(countryCode, stateCode, value) {
  if (!countryCode || !value) return "";
  const needle = String(value).trim();
  if (!needle) return "";
  const cities = await getCityOptions(countryCode, stateCode || undefined);
  const match = cities.find((option) => option.label.toLowerCase() === needle.toLowerCase());
  return match?.value ?? "";
}

/**
 * Map persisted address names/codes back to form select values.
 * @param {Record<string, string | null | undefined> | null | undefined} address
 */
export async function resolveAddressFormValues(address) {
  if (!address) return emptyAddressForm();

  const country = findCountryCode(address.country);
  const hasStates = country ? (await getStateOptions(country)).length > 0 : false;
  const region = country && hasStates ? await findStateCode(country, address.region) : "";
  const city =
    country && (region || !hasStates)
      ? await findCityValue(country, region, address.city)
      : address.city ?? "";

  return {
    line1: address.line1 ?? "",
    line2: address.line2 ?? "",
    city,
    region,
    postalCode: address.postalCode ?? "",
    country,
  };
}

/**
 * Map form select values to human-readable names for storage.
 * @param {Record<string, string | null | undefined> | null | undefined} address
 */
export async function normalizeAddressForStorage(address) {
  if (!address || !Object.values(address).some(Boolean)) return null;

  const countryOption = getCountryOptions().find((option) => option.value === address.country);
  const stateOptions = address.country ? await getStateOptions(address.country) : [];
  const stateOption = stateOptions.find((option) => option.value === address.region);
  const cityOptions =
    address.country && (address.region || stateOptions.length === 0)
      ? await getCityOptions(address.country, address.region || undefined)
      : [];
  const cityOption = cityOptions.find((option) => option.value === address.city);

  return {
    line1: address.line1?.trim() || null,
    line2: address.line2?.trim() || null,
    city: (cityOption?.label ?? address.city?.trim()) || null,
    region: (stateOption?.label ?? address.region?.trim()) || null,
    postalCode: address.postalCode?.trim() || null,
    country: (countryOption?.label ?? address.country?.trim()) || null,
  };
}

/** @param {Record<string, string | null | undefined> | null | undefined} address */
export function formatStoredAddress(address) {
  if (!address) return "—";
  const countryLabel =
    findCountryCode(address.country)
      ? getCountryOptions().find((option) => option.value === findCountryCode(address.country))
          ?.label
      : address.country;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    countryLabel,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}
