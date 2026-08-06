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
