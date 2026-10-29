import { norm } from "./geo";

let countriesPromise = null;
export function loadCountries() {
  countriesPromise ||= fetch("/geo/countries.json")
    .then((r) => { if (!r.ok) throw new Error("Could not load the country list."); return r.json(); })
    .then((rows) => rows.map(([iso2, name, lat, lng, stateCount, cityCount]) => ({ key: iso2, iso2, name, lat, lng, stateCount, cityCount, n: norm(name) })))
    .catch((e) => { countriesPromise = null; throw e; });
  return countriesPromise;
}

const countryCache = new Map();
export function loadCountry(iso2) {
  if (!countryCache.has(iso2)) {
    countryCache.set(
      iso2,
      fetch(`/geo/c/${iso2}.json`)
        .then((r) => { if (!r.ok) throw new Error("Could not load regions for this country."); return r.json(); })
        .then(({ s, c }) => {
          const states = s.map(([id, code, name, lat, lng]) => ({ key: id, id, code, name, lat, lng, n: norm(name) }));
          const citiesByState = new Map();
          for (const [id, stateId, name, lat, lng] of c) {
            if (!citiesByState.has(stateId)) citiesByState.set(stateId, []);
            citiesByState.get(stateId).push({ key: id, id, stateId, name, lat, lng, n: norm(name) });
          }
          return { states, citiesByState };
        })
        .catch((e) => { countryCache.delete(iso2); throw e; })
    );
  }
  return countryCache.get(iso2);
}

const base = (c) => ({ country: c.name, countryCode: c.iso2 });

export const countryPlace = (c) => ({
  ...base(c), name: c.name, label: c.name, type: "country", city: null, state: null,
  lat: c.lat, lng: c.lng, approx: false, source: "browse",
});

export function statePlace(c, s) {
  const exact = s.lat != null && s.lng != null;
  return {
    ...base(c), name: s.name, label: `${s.name}, ${c.name}`, type: "state", city: null, state: s.name,
    lat: exact ? s.lat : c.lat, lng: exact ? s.lng : c.lng, approx: !exact, source: exact ? "browse" : "browse_approx",
  };
}

export function cityPlace(c, s, ct) {
  const exact = ct.lat != null && ct.lng != null;
  const fb = s.lat != null && s.lng != null ? s : c; // state centre, else country centre
  return {
    ...base(c), name: ct.name, label: `${ct.name}, ${s.name}, ${c.name}`, type: "city", city: ct.name, state: s.name,
    lat: exact ? ct.lat : fb.lat, lng: exact ? ct.lng : fb.lng, approx: !exact, source: exact ? "browse" : "browse_approx",
  };
}
