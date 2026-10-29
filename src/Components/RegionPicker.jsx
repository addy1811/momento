import { useEffect, useMemo, useState } from "react";
import Combobox from "./Combobox";
import { loadCountries, loadCountry, countryPlace, statePlace, cityPlace } from "../utils/geoData";
import { norm } from "../utils/geo";

export default function RegionPicker({ value, onChange }) {
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [data, setData] = useState(null); 
  const [state, setState] = useState(null);
  const [city, setCity] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await loadCountries();
        if (!alive) return;
        setCountries(list);
        setLoadingList(false);
        const c = value?.countryCode && list.find((x) => x.iso2 === value.countryCode);
        if (!c) return;
        setCountry(c);
        setLoadingData(true);
        const d = await loadCountry(c.iso2);
        if (!alive) return;
        setData(d);
        setLoadingData(false);
        const st = value.state && d.states.find((s) => norm(s.name) === norm(value.state));
        if (!st) return;
        setState(st);
        const ct = value.city && (d.citiesByState.get(st.id) || []).find((x) => norm(x.name) === norm(value.city));
        if (ct) setCity(ct);
      } catch (e) {
        if (alive) { setError(e.message); setLoadingList(false); setLoadingData(false); }
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!value) { setCountry(null); setState(null); setCity(null); setData(null); }
  }, [value]);

  const cities = useMemo(() => (data && state ? data.citiesByState.get(state.id) || [] : []), [data, state]);

  const pickCountry = async (c) => {
    setCountry(c); setState(null); setCity(null); setData(null); setError(null);
    onChange(countryPlace(c));
    setLoadingData(true);
    try { setData(await loadCountry(c.iso2)); } catch (e) { setError(e.message); } finally { setLoadingData(false); }
  };
  const pickState = (s) => { setState(s); setCity(null); onChange(statePlace(country, s)); };
  const pickCity = (ct) => { setCity(ct); onChange(cityPlace(country, state, ct)); };

  const noStates = country && data && data.states.length === 0;
  const noCities = state && data && cities.length === 0;

  return (
    <div className="rp">
      <Combobox label="Country" items={countries} value={country} onSelect={pickCountry} placeholder="Choose a country" loading={loadingList} />
      <Combobox
        label="State / region"
        items={data?.states || []}
        value={state}
        onSelect={pickState}
        placeholder={noStates ? "No regions listed" : "Choose a state or region"}
        disabled={!country || !data || noStates}
        loading={loadingData}
      />
      <Combobox
        label="City"
        items={cities}
        value={city}
        onSelect={pickCity}
        placeholder={noCities ? "No cities listed" : "Choose a city"}
        disabled={!state || noCities}
      />
      {error && <p className="lp-error">{error}</p>}
      {noStates && <p className="lp-hint">{country.name} has no regions in the list. Drag the pin on the map, or use Search.</p>}
      {noCities && <p className="lp-hint">No cities are listed for {state.name}. The pin sits at the region centre; drag it to the exact spot.</p>}
    </div>
  );
}
