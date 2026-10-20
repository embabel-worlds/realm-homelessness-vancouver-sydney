#!/bin/sh
# Download every source file build_reference.py reads into data/source/ (git-ignored).
# vancouver.ca blocks scripted fetches; nothing here depends on it.
set -eu
cd "$(dirname "$0")/../data/source" 2>/dev/null || { mkdir -p "$(dirname "$0")/../data/source"; cd "$(dirname "$0")/../data/source"; }
get() { echo "$1"; curl -fsSL -A 'Mozilla/5.0' -o "$1" "$2"; }

get hsabc_2025_final.pdf 'https://hsa-bc.ca/_Library/2025_HC/2025_Point-in-Time_Homeless_Count_for_Greater_Vancouver_Final_Report.pdf'
get bc_hl_geo_summary.csv "$(curl -fsSL 'https://catalogue.data.gov.bc.ca/api/3/action/package_show?id=fbb1584f-7f93-47e7-8001-16e3087bddea' | python3 -c 'import json,sys; print(next(r["url"] for r in json.load(sys.stdin)["result"]["resources"] if r["url"].endswith("hl_geo_summary.csv")))')"
curl -fsSL -o 14100353.zip 'https://www150.statcan.gc.ca/n1/tbl/csv/14100353-eng.zip' && unzip -p 14100353.zip 14100353.csv > statcan_14100353.csv && rm 14100353.zip
curl -fsSL -o 98100002.zip 'https://www150.statcan.gc.ca/n1/tbl/csv/98100002-eng.zip' && unzip -p 98100002.zip 98100002.csv > statcan_98100002.csv && rm 98100002.zip
curl -fsSL -o 17100148.zip 'https://www150.statcan.gc.ca/n1/tbl/csv/17100148-eng.zip' \
  && unzip -p 17100148.zip 17100148.csv | grep '"Vancouver (CMA), British Columbia".*"Total - gender","All ages"' > statcan_17100148_vancouver_cma_total.csv && rm 17100148.zip

get cos_streetcounts.html 'https://www.cityofsydney.nsw.gov.au/public-health-safety-programs/street-counts'
get nsw_streetcount_2026_tp.pdf 'https://www.nsw.gov.au/sites/default/files/noindex/2026-05/2026-nsw-street-count-technical-paper.pdf'
for n in 1 6 7; do get abs_20490do00${n}_2021.xlsx "https://www.abs.gov.au/statistics/people/housing/estimating-homelessness-census/2021/20490do00${n}_2021.xlsx"; done
get abs_erp_lga2025_cityofsydney.csv 'https://data.api.abs.gov.au/rest/data/ABS,ERP_LGA2025,1.0.0/ERP.LGA2025.17200.A?format=csv'
get abs_erp_gccsa_greatersydney.csv 'https://data.api.abs.gov.au/rest/data/ABS,ABS_ANNUAL_ERP_ASGS2021,1.2.0/ERP.GCCSA.1GSYD.A?format=csv'
