"""
Fetch monthly retail trade index for ICT/electronics goods in EMEA from Eurostat
and compute a 12-month seasonality curve.

Dataset: sts_trtu_m  (Turnover and volume of sales in wholesale and retail trade)
NACE:    G47_4       (Retail sale of information and communication equipment
                     in specialised stores)
Indicator: TOVT      (Turnover, total)
Adjustment: NSA      (Not seasonally adjusted -- needed to extract seasonality)
Unit:    I21         (Index, 2021=100)
Geo:     EU27_2020 + IT, DE, FR, ES, UK aggregate

Run this on a machine with outbound access to ec.europa.eu.
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import pandas as pd
import requests

EUROSTAT_BASE = (
    "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/"
    "sts_trtu_m/M.TOVT.NSA.I21.G47_4.{geo}/?startPeriod=2019-01&format=SDMX-CSV"
)

GEOS = ["EU27_2020", "IT", "DE", "FR", "ES", "UK"]
OUT_DIR = Path(__file__).resolve().parent.parent / "reports"


def fetch(geo: str) -> pd.DataFrame:
    url = EUROSTAT_BASE.format(geo=geo)
    r = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text))
    df = df[["TIME_PERIOD", "OBS_VALUE"]].rename(
        columns={"TIME_PERIOD": "period", "OBS_VALUE": "index"}
    )
    df["period"] = pd.to_datetime(df["period"])
    df["geo"] = geo
    return df


def seasonality(df: pd.DataFrame) -> pd.Series:
    """Average monthly index / yearly mean -> 12-point seasonal curve (mean = 100)."""
    s = df.set_index("period")["index"].astype(float)
    yearly_mean = s.groupby(s.index.year).transform("mean")
    rel = (s / yearly_mean) * 100
    return rel.groupby(rel.index.month).mean().round(1)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = []
    curves = {}
    for geo in GEOS:
        try:
            df = fetch(geo)
            frames.append(df)
            curves[geo] = seasonality(df)
            print(f"OK {geo}: {len(df)} rows")
        except Exception as e:
            print(f"SKIP {geo}: {e}", file=sys.stderr)

    raw = pd.concat(frames, ignore_index=True)
    raw.to_csv(OUT_DIR / "eurostat_raw.csv", index=False)

    curve = pd.DataFrame(curves)
    curve.index.name = "month"
    curve.to_csv(OUT_DIR / "seasonality_CE_EMEA.csv")
    print(curve)


if __name__ == "__main__":
    main()
