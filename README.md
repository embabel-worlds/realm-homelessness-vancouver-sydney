# realm-homelessness-vancouver-sydney

Homelessness in Vancouver and Sydney, side by side, from the counts each city actually publishes,
stored in the world so a comparison is one query. Keyless; nothing to configure.

| Type | Records | What it is |
|---|---|---|
| `HomelessnessSource` | 6 | One published count: who runs it, who it counts, its tier and caveats |
| `HomelessnessPlace` | 93 | Metro Vancouver, City of Vancouver, BC, 11 count sub-regions; Greater Sydney, City of Sydney, NSW, 76 NSW LGAs. `-[:WITHIN]->` parent |
| `PlacePopulation` | 77 | Census counts and official estimates, the denominators for rates. `-[:OF]->HomelessnessPlace` |
| `HomelessnessFigure` | 861 | One published number: source × place × occasion × measure, with a rate per 10,000 where a population is held. `-[:AT]->`, `-[:FROM]->` |

## The sources

| Source | City | Tier | Years | Format published |
|---|---|---|---|---|
| Greater Vancouver Point-in-Time Count (HSABC) | Vancouver | one night, street + shelter | 2005–2025, every ~3 years | PDF |
| BC Stats annual estimate | Vancouver | a year of service use | 2019–2024 | CSV (OGL-BC) |
| Shelter capacity, StatCan 14-10-0353 | Vancouver | beds | 2016–2025 | CSV (StatCan Open Licence) |
| City of Sydney Street Count | Sydney | one night, street | Feb + Aug 2010–2021, Feb 2022–2026 | HTML table |
| NSW Statewide Street Count | Sydney | one night, street | 2020–2026, by LGA | PDF |
| ABS Estimating Homelessness: Census | Sydney | census estimate | 2006–2021 (NSW), 2016/2021 (City of Sydney), 2021 (Greater Sydney) | XLSX (CC BY 4.0) |

## The two cities do not count the same thing

This is the whole design. Every figure carries its source's `tier`, and only where the meaning
lines up a `compareAs` family:

| `compareAs` | Vancouver | Sydney |
|---|---|---|
| `sleepingOutside` | PiT **unsheltered**: outdoors, tents, vehicles, AND couch-surfing (17% of it in 2025) | street-count **rough sleepers**; ABS **sleeping out / improvised dwellings** |
| `inCrisisAccommodation` | PiT **sheltered**: shelters, extreme-weather beds, transition houses, hospital/police with no fixed address | City of Sydney **occupied crisis and temporary beds**; ABS **supported accommodation** |
| `oneNightTotal` | PiT **total** | City of Sydney rough sleepers + occupied beds (derived, flagged) |

Figures with no counterpart carry no `compareAs`. The ABS total in particular is never compared
with a Vancouver total: about half of Greater Sydney's 25,141 homeless in 2021 were in "severely"
crowded dwellings and a third in boarding houses, neither of which Canada counts as homelessness.
The 2021 census also fell in Sydney's Delta lockdown, so its rough-sleeping figure is far down
(City of Sydney 64, against 631 in 2016). BC Stats' annual estimate counts everyone seen in a year,
two to three times a one-night count; it is compared only with itself.

The headline (`LatestComparison`):

| | City of Vancouver (Mar 2025) | City of Sydney (Feb 2026) |
|---|---|---|
| sleeping outside | 763 — 11.5 per 10k | 296 — 12.2 per 10k |
| in crisis accommodation | 1,952 — 29.5 per 10k | 348 — 14.4 per 10k |
| one-night total | 2,715 — 41.0 per 10k | 644 — 26.6 per 10k |

Rates use the nearest population held, and the year is stored beside the rate: the City of
Vancouver has census populations for 2016 and 2021 only, so its 2025 rates use 2021 and read a
little high.

## Views

`LatestComparison`, `CityComparison` (one family, city or metro scale, every count),
`PlaceSeries`, `CountBreakdown`, `VancouverSubregions`, `VancouverDemographics`,
`VancouverShelterBeds`, `BcAnnualEstimate`, `SydneyStreetCount`, `NswStreetCountLgas`,
`GreaterSydneyStreetCount`, `AbsHomelessGroups`, `HomelessnessPlaces`, `HomelessnessSources`
(`views/homelessness.yml`).

## What it does not hold

- The City of Vancouver's own counts in years between regional counts (2010–2020, published as
  PDFs on vancouver.ca, which refuses scripted downloads).
- Specialist Homelessness Services client data below state level (AIHW publishes it only through
  an interactive tool), and HIFIS shelter-use data for Vancouver (not open).
- Demographics for Sydney's street counts (none are published); Vancouver's are from the 2025 survey
  only, and are shares of those who answered.
- ABS small-area figures beyond the City of Sydney LGA and Greater Sydney.

## Known quirks in the sources, kept as printed

- HSABC Table 3 prints the 2008 total as 2,174; its own sheltered and unsheltered rows and Table 2
  give 2,660, which is used.
- HSABC Table 2's sub-regions fall 12–19 short of the regional total in 2005–2014, the years Delta
  and White Rock are n/a; from 2017 they add up exactly.
- The NSW 2026 technical paper lists only LGAs still counted, so its LGA rows fall short of its own
  NSW totals for 2020, 2021 and 2023 (Parkes, last counted in 2025, is one). The published totals
  are stored, with the shortfall noted on them; from 2024 the LGAs add up exactly.
- StatCan 14-10-0353 gives the City of Vancouver identical bed counts for 2016 and 2017 (895
  emergency, 533 transitional, 137 domestic-violence) though the shelter counts differ; kept as
  published.
- The City of Sydney page's August 2016 row has no `<tr>`; it is read with an HTML5 parser, as a
  browser reads it.

## Rebuilding the reference data

```bash
pip install pyyaml openpyxl pymupdf html5lib
scripts/fetch_sources.sh               # downloads every source into data/source/ (git-ignored)
python3 scripts/build_reference.py     # writes reference/
python3 tests/ground_truth.py          # re-reads the sources a second way, writes tests/expected.json
EMBABEL_USER=… EMBABEL_PASSWORD=… node tests/views.smoke.mjs
```

The Greater Vancouver figures are transcribed in `data/curated/hsabc-greater-vancouver.yml`,
citing the table each comes from, because HSABC publishes only PDFs; the ground-truth check proves
their arithmetic. Everything else is read from the source files by the build.

## Licences

Realm code: GPL-3.0. Data: ABS CC BY 4.0; Statistics Canada Open Licence; Open Government Licence –
British Columbia; HSABC, City of Sydney and NSW figures reproduced with attribution (no open
licence is stated for them).
