# ROYAL MADRID — Factual Source Coverage & Completeness Report

This document records the exact factual coverage, licensing, rate limits, available fields, and known gaps across all free football data sources used by **ROYAL MADRID**.

---

## 1. Data Sources, Licenses & Priority Hierarchy

When multiple sources report on the same match, player, or trophy, the data engine resolves conflicts strictly according to the following priority order:

| Priority Rank | Source Name | Type | License / Terms | Free-Tier Limits | Primary Role in Archive |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | **Official Real Madrid CF / UEFA / RFEF / FIFA Historical Registries** | Curated Official Reference | Factual Historical Data | Unlimited (Local SQL Seed) | All-time trophy totals (`15` UCL, `36` La Liga, `20` Copa del Rey, etc.), all-time player career totals, 2011/12 La Liga 38-match dataset, and major European/Domestic Finals. |
| **#2** | **OpenFootball — España (`openfootball/espana`)** | Public-Domain Repository | `CC0-1.0` Public Domain | Unlimited (Cloned Locally) | Official La Liga (`1-liga.txt` 2012/13–2026/27), full detailed 2025/26 La Liga match sheets (`1-liga-full.txt`), and Copa del Rey (`cup.txt` 2020/21–2024/25). |
| **#3** | **OpenFootball — UEFA Champions League (`openfootball/champions-league`)** | Public-Domain Repository | `CC0-1.0` Public Domain | Unlimited (Cloned Locally) | All 184 Real Madrid UEFA Champions League fixtures from 2011/12 through 2025/26 (`cl.txt`). |
| **#4** | **football-data.org v4 Free Tier** | Server-Side REST API | Free Plan (`X-Auth-Token`) | 10 requests / minute | Optional live/daily synchronization of completed La Liga (`PD`) and Champions League (`CL`) fixtures for Real Madrid (`Team ID 86`). |
| **#5** | **API-Football v3 Free Plan** | Server-Side REST API | Free Plan (`x-apisports-key`) | 100 requests / day | Secondary optional verification adapter for completed fixtures (`Team ID 541`). |

---

## 2. Competition & Season Coverage Matrix (2011/12 Onward)

| Competition | Season Range | Matches Covered | Available Fields | Missing / Unavailable Fields | Completeness Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **La Liga (`LALIGA`)** | `2011/12` | `38 / 38` | Date, matchday, home/away team, final score, venue, Real Madrid goalscorers & minutes (incl. penalties). | Full 22-man starting lineups, substitutions, yellow/red cards, referee. | **Verified** |
| **La Liga (`LALIGA`)** | `2012/13 – 2024/25` | `494 / 494` | Date, matchday, home/away team, final score, half-time score (most seasons). | Starting lineups, substitutions, bookings, referee, attendance (except major clásicos). | **Verified** |
| **La Liga (`LALIGA`)** | `2025/26` (`1-liga-full.txt`) | `38 / 38` | Date, kickoff time, venue, attendance, referee, final & HT score, **full starting XI lineups**, **substitutions with minutes**, **yellow/red cards**, **goalscorers & minutes**. | Official player match ratings, team possession/xG. | **Verified** |
| **La Liga (`LALIGA`)** | `2026/27` | `4 / 38` | Completed Matchdays 1–4 scores & dates (`openfootball/espana/2026-27/1-liga.txt`). | Matchdays 5–38 (unplayed future fixtures are excluded per project rules). | **Partial** |
| **UEFA Champions League (`UCL`)** | `2011/12 – 2025/26` | `184 / 184` | Date, stage/round, home/away team, final/HT/AET/penalty scores; **full starting XI, substitutions, cards, referee, attendance, and goalscorers** for victorious Finals (`2014`, `2016`, `2017`, `2018`, `2022`, `2024`). | Starting lineups and booking minutes for non-final group/knockout fixtures in standard `cl.txt`. | **Verified** |
| **Copa del Rey (`COPA`)** | `2011/12 – 2024/25` | `20` (Finals + `2020/21–2024/25` ties) | Full `cup.txt` ties for `2020/21–2024/25` plus verified `2013/14` and `2022/23` Finals with full lineups, scorers, referee, and attendance. | Early-round Copa del Rey ties between `2011/12` and `2019/20` (not published in `openfootball/espana`). | **Partial** |
| **Supercopa, UEFA Super Cup, Club World Cup** | `2011/12 – 2024/25` | `4` Featured Finals + Trophy Registry | All-time trophy counts (`100% Verified`) plus detailed match sheets for key Finals (`2017` Supercopa, `2022` UEFA Super Cup, `2022` FIFA Club World Cup). | Non-final matches in Supercopa/CWC are not published in OpenFootball repositories. | **Partial** |

---

## 3. Documented Inter-Source Conflicts & Resolution Policy

1. **Cristiano Ronaldo All-Time Real Madrid Goal Count (`450` vs `451`)**:
   - **Conflict**: Real Madrid CF Official Website and UEFA credit Cristiano Ronaldo with `450` official goals in `438` appearances (`311` in La Liga). Newspaper *Marca* (which awards the Pichichi Trophy) credits him with `451` (`312` in La Liga) due to a deflected free kick off Pepe against Real Sociedad on 18 September 2010.
   - **Resolution**: **ROYAL MADRID** uses the official Real Madrid CF / RFEF referee match report count of **`450` goals** (`311` in La Liga) as the primary metric and documents the *Marca* `451` figure in the Admin Conflict Registry.
2. **World Champion Titles Methodology (`5` FIFA Club World Cups + `4` Intercontinental Cups)**:
   - **Resolution**: Listed as distinct competitions on the Honours page to prevent double-counting across historical format changes (`1960`, `1998`, `2002` UEFA/CONMEBOL Intercontinental Cup + `2024` FIFA Intercontinental Cup vs. `2014`, `2016`, `2017`, `2018`, `2022` FIFA Club World Cup).
