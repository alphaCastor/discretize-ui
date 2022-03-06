import prettier from 'prettier';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as url from 'node:url';

const API_LANGUAGES = ['de', 'en', 'es', 'fr', 'zh'];
const GW2_API_URL = 'https://api.guildwars2.com';

const AUTOGENERATE_HEADER = `
// This file is autogenerated by /generate_from_api.mjs
// Do not edit this file directly - it will be overwritten

`;

let prettier_options = null;
function writeSource(filepath, content) {
  filepath = path.join('src', filepath);
  let prettied = prettier.format(AUTOGENERATE_HEADER + content, {
    ...prettier_options,
    filepath,
  });
  console.log('Generating', filepath);
  fs.writeFileSync(filepath, prettied, 'utf8');
}

const FETCH_OPTIONS = {
  method: 'GET',
  mode: 'cors',
  credentials: 'omit',
  redirect: 'error',
};

async function fetch_api(path) {
  let url = GW2_API_URL + path;
  console.log('Fetching', url);
  let res = await fetch(url, FETCH_OPTIONS);
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  let json = await res.json();
  return json;
}

function to_record(arr, key = 'id') {
  let record = {};
  for (let e of arr) {
    record[e[key]] = e;
  }
  return record;
}

function compare_strings(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
function sort_object_by_key(o) {
  return Object.fromEntries(
    Object.entries(o).sort(([a], [b]) => compare_strings(a, b)),
  );
}
async function run() {
  prettier_options = await prettier.resolveConfig(
    url.fileURLToPath(import.meta.url),
  );

  // Fetch everything first. This will abort when the API is unreachable.
  let professions = {};
  for (let lang of API_LANGUAGES) {
    professions[lang] = to_record(
      await fetch_api(`/v2/professions?ids=all&lang=${lang}`),
    );
  }
  let races = {};
  for (let lang of API_LANGUAGES) {
    races[lang] = to_record(await fetch_api(`/v2/races?ids=all&lang=${lang}`));
  }

  console.log('Done fetching, generating files');
  const PROFESSION_IDS = Object.keys(professions.en).sort();
  let PROFESSION_IDS_WITH_ELITE_SPECS = [...PROFESSION_IDS];
  let PROFESSIONS = {};
  let TRANSLATIONS_PROFESSIONS = {};
  for (let id of PROFESSION_IDS) {
    let p = professions.en[id];
    let translations = {};
    for (let lang of API_LANGUAGES) {
      let name = professions[lang][id].name;
      if (name !== id) {
        translations[lang] = professions[lang][id].name;
      }
    }
    TRANSLATIONS_PROFESSIONS[id] = translations;

    // We could fetch the names from /v2/specializations, but the names are in the training data as well
    let elite_specs = [];
    for (let t of p.training) {
      if (t.category !== 'EliteSpecializations') {
        continue;
      }
      elite_specs.push(t.name);
      PROFESSION_IDS_WITH_ELITE_SPECS.push(t.name);

      let translations = {};
      for (let lang of API_LANGUAGES) {
        for (let t2 of professions[lang][id].training) {
          if (t2.id === t.id) {
            if (t.name !== t2.name) {
              translations[lang] = t2.name;
            }
            break;
          }
        }
      }
      TRANSLATIONS_PROFESSIONS[t.name] = translations;
    }
    PROFESSIONS[id] = elite_specs;
  }

  writeSource(
    'data/professions.ts',
    `
export type ProfessionTypes = ${PROFESSION_IDS_WITH_ELITE_SPECS.map((id) =>
      JSON.stringify(id),
    )
      .sort()
      .join(' | ')};

const PROFESSIONS: Record<string, string[]> = ${JSON.stringify(PROFESSIONS)};
export default PROFESSIONS;
`,
  );

  writeSource(
    'i18n/professions.ts',
    `
import type { Translation } from '.';
import type { ProfessionTypes } from '../data/professions';

const TRANSLATIONS_PROFESSIONS: Record<ProfessionTypes, Translation> = ${JSON.stringify(
      sort_object_by_key(TRANSLATIONS_PROFESSIONS),
    )};
export default TRANSLATIONS_PROFESSIONS;
  `,
  );

  let SPECIALIZATIONS = Object.fromEntries(
    PROFESSION_IDS.map((id) => {
      let p = professions.en[id];
      return [p.id, [...p.specializations].sort((a, b) => a - b)];
    }),
  );
  writeSource(
    'data/specializations.ts',
    `
import type { ProfessionTypes } from './professions';
const SPECIALIZATIONS: Partial<Record<ProfessionTypes, number[]>> = ${JSON.stringify(
      SPECIALIZATIONS,
    )};
export default SPECIALIZATIONS;
  `,
  );

  const RACE_IDS = Object.keys(races.en).sort();
  let TRANSLATIONS_RACES = {};
  for (let id of RACE_IDS) {
    let translations = {};
    for (let lang of API_LANGUAGES) {
      let name = races[lang][id].name;
      if (name !== id) {
        translations[lang] = races[lang][id].name;
      }
    }
    TRANSLATIONS_RACES[id] = translations;
  }

  writeSource(
    'data/races.ts',
    `
export type RacesTypes = ${RACE_IDS.map((id) => JSON.stringify(id)).join(
      ' | ',
    )};

const RACES: RacesTypes[] = ${JSON.stringify(RACE_IDS)};
export default RACES;`,
  );

  writeSource(
    'i18n/races.ts',
    `
import type { Translation } from '.';
import type { RacesTypes } from '../data/races';

const TRANSLATIONS_RACES: Record<RacesTypes, Translation> = ${JSON.stringify(
      sort_object_by_key(TRANSLATIONS_RACES),
    )};
export default TRANSLATIONS_RACES;
  `,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
