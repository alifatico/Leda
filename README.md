# Leda — Stagionalita Consumer Electronics EMEA

Curva mensile di stagionalita per il canale Consumer Electronics in EMEA,
pensata come overlay per analisi di prodotti wearables (Ray-Ban Meta /
EssilorLuxottica).

## Deliverable

- `reports/seasonality_CE_EMEA.xlsx` — file pronto per il manager (tabella +
  grafico + note metodologiche).
- `reports/seasonality_CE_EMEA.png` — grafico standalone.

## Come rigenerare con dati live

L'ambiente di sviluppo corrente non ha accesso a Eurostat. Su una macchina
con outbound libero:

```bash
pip install -r requirements.txt
python src/fetch_eurostat.py      # scarica sts_trtu_m G47.4
python src/build_deliverable.py   # rigenera xlsx + png
```

`fetch_eurostat.py` produce `reports/seasonality_CE_EMEA.csv`;
`build_deliverable.py` lo legge automaticamente al posto della curva
indicativa.

## Fonte

Eurostat `sts_trtu_m` — Retail trade index, NACE G47.4
(Information and communication equipment in specialised stores),
EU27 + EU5, non destagionalizzato, indice 2021=100.
