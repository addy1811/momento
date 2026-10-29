import fs from "node:fs";
import path from "node:path";

const src = process.argv[2] || "./geo-source";
const out = path.resolve("public/geo");
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f), "utf8"));

const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const r5 = (n) => Math.round(n * 1e5) / 1e5; // ~1 m
const ok = (lat, lng) => lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
const pt = (lat, lng) => (ok(lat, lng) ? [r5(lat), r5(lng)] : [null, null]);
const byName = (a, b) => a[2].localeCompare(b[2], "en", { sensitivity: "base" });

const countries = read("countries.json");
const states = read("states.json");
const cities = read("cities.json");

const statesBy = new Map();
for (const s of states) {
  const [lat, lng] = pt(num(s.latitude), num(s.longitude));
  if (!statesBy.has(s.country_code)) statesBy.set(s.country_code, []);
  statesBy.get(s.country_code).push([s.id, s.state_code || "", s.name, lat, lng]);
}
const citiesBy = new Map();
let noCoords = 0;
for (const c of cities) {
  const [lat, lng] = pt(num(c.latitude), num(c.longitude));
  if (lat === null) noCoords++;
  if (!citiesBy.has(c.country_code)) citiesBy.set(c.country_code, []);
  citiesBy.get(c.country_code).push([c.id, c.state_id, c.name, lat, lng]);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "c"), { recursive: true });
const write = (file, data) => fs.writeFileSync(path.join(out, file), JSON.stringify(data));

const list = [];
for (const c of countries) {
  const [lat, lng] = pt(num(c.latitude), num(c.longitude));
  if (lat === null) continue;
  const st = (statesBy.get(c.iso2) || []).sort((a, b) => a[2].localeCompare(b[2], "en", { sensitivity: "base" }));
  const ci = (citiesBy.get(c.iso2) || []).sort(byName);
  list.push([c.iso2, c.name, lat, lng, st.length, ci.length]);
  write(`c/${c.iso2}.json`, { s: st, c: ci });
}
list.sort((a, b) => a[1].localeCompare(b[1], "en", { sensitivity: "base" }));
write("countries.json", list);

console.log(`countries: ${list.length}  states: ${states.length}  cities: ${cities.length}  (cities without coordinates: ${noCoords})`);
