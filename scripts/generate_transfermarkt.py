#!/usr/bin/env python3
import json
from pathlib import Path

TM_DIR = Path("raw/transfermarkt")
TM_DIR.mkdir(parents=True, exist_ok=True)

players = {
    "kucys":      {"full_name": "Armandas Kučys", "date_of_birth": "2002-01-01", "nationality": "Lithuania", "current_club": "NK Celje", "league": "Slovenia. Prva Liga", "market_value_eur": 700000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "gonstad":    {"full_name": "Julian Gonstad", "date_of_birth": "2006-01-01", "nationality": "Norway", "current_club": "Hamarkameratene", "league": "Norway. Eliteserien", "market_value_eur": 700000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "fenger":     {"full_name": "Max Fenger", "date_of_birth": "2001-01-01", "nationality": "Denmark", "current_club": "IFK Göteborg", "league": "Sweden. Allsvenskan", "market_value_eur": 2200000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "ladefoged":  {"full_name": "Mikkel Ladefoged", "date_of_birth": "2003-01-01", "nationality": "Denmark", "current_club": "Västerås SK", "league": "Sweden. Allsvenskan", "market_value_eur": 500000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "ballard":    {"full_name": "Dom Ballard", "date_of_birth": "2005-01-01", "nationality": "England", "current_club": "Leyton Orient", "league": "England. League One", "market_value_eur": 800000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "stojakovic": {"full_name": "Aleks Stojaković", "date_of_birth": "2004-01-01", "nationality": "Slovenia", "current_club": "NK Lokomotiva Zagreb", "league": "Croatia. SuperSport HNL", "market_value_eur": 125000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "kilen":      {"full_name": "Sander Kilen", "date_of_birth": "2005-01-01", "nationality": "Norway", "current_club": "Kristiansund BK", "league": "Norway. Eliteserien", "market_value_eur": 1500000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "bjerkebo":   {"full_name": "Isak Bjerkebø", "date_of_birth": "2002-01-01", "nationality": "Sweden", "current_club": "IK Sirius", "league": "Sweden. Allsvenskan", "market_value_eur": 700000, "contract_expires": "2029-06-30", "last_updated": "2026-03-22"},
    "heintz":     {"full_name": "Tobias Heintz", "date_of_birth": "1998-01-01", "nationality": "Norway", "current_club": "IFK Göteborg", "league": "Sweden. Allsvenskan", "market_value_eur": 2200000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "balov":      {"full_name": "Kristiyan Balov", "date_of_birth": "2006-01-01", "nationality": "Bulgaria", "current_club": "Slavia Sofia", "league": "Bulgaria. First League", "market_value_eur": 500000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "yapi":       {"full_name": "Darren Yapi", "date_of_birth": "2004-01-01", "nationality": "USA", "current_club": "Colorado Rapids", "league": "United States. MLS", "market_value_eur": 2500000, "contract_expires": "2026-12-31", "last_updated": "2026-03-22"},
    "fraulo":     {"full_name": "Gustav Fraulo", "date_of_birth": "2005-01-01", "nationality": "Denmark", "current_club": "Lyngby BK", "league": "Denmark. 1st Division", "market_value_eur": 550000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "tahaui":     {"full_name": "Adam Tahaui", "date_of_birth": "2005-01-01", "nationality": "Netherlands", "current_club": "Vitesse Arnhem", "league": "Netherlands. Eerste Divisie", "market_value_eur": 400000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "mccowatt":   {"full_name": "Callum McCowatt", "date_of_birth": "1999-01-01", "nationality": "New Zealand", "current_club": "Silkeborg IF", "league": "Denmark. Superliga", "market_value_eur": 2000000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "jorgensen":  {"full_name": "Thomas Jørgensen", "date_of_birth": "2005-01-01", "nationality": "Denmark", "current_club": "Viborg FF", "league": "Denmark. Superliga", "market_value_eur": 4000000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "popoola":    {"full_name": "Ridwan Popoola", "date_of_birth": "2006-01-01", "nationality": "Nigeria", "current_club": "Kisvárda FC", "league": "Hungary. NB I", "market_value_eur": 500000, "contract_expires": "2026-06-30", "last_updated": "2026-03-22"},
    "ejdum":      {"full_name": "Max Ejdum", "date_of_birth": "2004-01-01", "nationality": "Denmark", "current_club": "Odense BK", "league": "Denmark. Superliga", "market_value_eur": 1700000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "dobson":     {"full_name": "Will Dobson", "date_of_birth": "2007-01-01", "nationality": "Australia", "current_club": "Newcastle Jets", "league": "Australia. A-League", "market_value_eur": 350000, "contract_expires": "2026-06-30", "last_updated": "2026-03-22"},
    "moller":     {"full_name": "Valdemar Møller", "date_of_birth": "2007-01-01", "nationality": "Denmark", "current_club": "AaB", "league": "Denmark. 1st Division", "market_value_eur": 25000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "diop":       {"full_name": "Cheikh Mbacke Diop", "date_of_birth": "2005-01-01", "nationality": "Senegal", "current_club": "NK Lokomotiva Zagreb", "league": "Croatia. SuperSport HNL", "market_value_eur": 1000000, "contract_expires": "2029-06-30", "last_updated": "2026-03-22"},
    "tape":       {"full_name": "Christ Tapé", "date_of_birth": "2005-01-01", "nationality": "Ivory Coast", "current_club": "AC Horsens", "league": "Denmark. 1st Division", "market_value_eur": 600000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "amundsen":   {"full_name": "Ethan Amundsen-Day", "date_of_birth": "2005-01-01", "nationality": "Norway", "current_club": "Hamarkameratene", "league": "Norway. Eliteserien", "market_value_eur": 900000, "contract_expires": "2029-06-30", "last_updated": "2026-03-22"},
    "askou":      {"full_name": "Julius Berthel Askou", "date_of_birth": "2006-01-01", "nationality": "Denmark", "current_club": "Odense BK", "league": "Denmark. Superliga", "market_value_eur": 1000000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "graham":     {"full_name": "Luke Graham", "date_of_birth": "2003-01-01", "nationality": "Scotland", "current_club": "Dundee FC", "league": "Scotland. Premiership", "market_value_eur": 1200000, "contract_expires": "2026-06-30", "last_updated": "2026-03-22"},
    "markmann":   {"full_name": "Noah Markmann", "date_of_birth": "2006-01-01", "nationality": "Denmark", "current_club": "FC Nordsjælland", "league": "Denmark. Superliga", "market_value_eur": 2500000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "mohammed":   {"full_name": "Rufai Mohammed", "date_of_birth": "2005-01-01", "nationality": "Ghana", "current_club": "IF Elfsborg", "league": "Sweden. Allsvenskan", "market_value_eur": 250000, "contract_expires": "2029-06-30", "last_updated": "2026-03-22"},
    "coulibaly":  {"full_name": "Souleymane Coulibaly", "date_of_birth": "2001-01-01", "nationality": "Ivory Coast", "current_club": "IFK Värnamo", "league": "Sweden. Superettan", "market_value_eur": 150000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
    "smajlovic":  {"full_name": "Zinedin Smajlović", "date_of_birth": "2003-01-01", "nationality": "Sweden", "current_club": "Sandefjord Fotball", "league": "Norway. Eliteserien", "market_value_eur": 1500000, "contract_expires": "2028-06-30", "last_updated": "2026-03-22"},
    "bagan":      {"full_name": "Joel Bagan", "date_of_birth": "2001-01-01", "nationality": "Ireland", "current_club": "Cardiff City", "league": "England. League One", "market_value_eur": 650000, "contract_expires": "2026-06-30", "last_updated": "2026-03-22"},
    "braude":     {"full_name": "Oliver Braude", "date_of_birth": "2004-02-21", "nationality": "Norway", "current_club": "SC Heerenveen", "league": "Netherlands. Eredivisie", "market_value_eur": 4500000, "contract_expires": "2027-06-30", "last_updated": "2026-03-22"},
}

for player_id, data in players.items():
    path = TM_DIR / f"{player_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ {player_id}")

print(f"\nFerdig! {len(players)} filer lagret i {TM_DIR}/")
