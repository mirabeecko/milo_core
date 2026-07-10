#!/usr/bin/env python3
"""
MiLO Analytics Sync — stahuje GA4 a Google Ads data pro dashboard.

Credentials: z /Users/mb/dev/dashboards and assistants/ads-live-dashboard/.env.local
GA4 property mapping: z /Users/mb/dev/.dev-status-checker/analytics-config.json

Spusteni: python3 sync_analytics.py [--quiet]
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

# --- Config: GA4 properties ---
GA4_PROPERTIES = {
    "sheskates.cz":    {"property_id": "540216883", "ga4_id": "G-KDMZ8KZC3F", "account_id": "540216883"},
    "ninja-tyden.cz":  {"property_id": "539768933", "ga4_id": "G-GBBN7TXHSV", "account_id": "539768933"},
    "tjkrupka.cz":     {"property_id": "511361257", "ga4_id": "G-NM6R8S2X39",  "account_id": "511361257"},
    "webdo24.cz":      {"property_id": "530284583", "ga4_id": "G-815XCLCGY8",  "account_id": "530284583"},
}

def ga4_link(property_id):
    return f"https://analytics.google.com/analytics/web/#/p{property_id}/reports/reportinghub"

def gtm_link(account_id):
    return f"https://tagmanager.google.com/#/admin/accounts/{account_id}"

def ads_link():
    return "https://ads.google.com/aw/campaigns"

# --- Config: Load credentials from ads-live-dashboard ---
def load_env(path):
    env = {}
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

env_paths = [
    SCRIPT_DIR / ".env.local",
    Path(os.environ.get("MILO_ADS_DASHBOARD_PATH", "/Users/mb/dev/dashboards and agents/ads-live-dashboard")) / ".env.local",
]
env = {}
for p in env_paths:
    if p.exists():
        env.update(load_env(p))

GOOGLE_CLIENT_ID = env.get("GOOGLE_ADS_CLIENT_ID", "") or env.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = env.get("GOOGLE_ADS_CLIENT_SECRET", "") or env.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REFRESH_TOKEN = env.get("GOOGLE_ADS_REFRESH_TOKEN", "")
GOOGLE_ADS_DEV_TOKEN = env.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
GOOGLE_ADS_LOGIN_CID = env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "").replace("-", "")

import urllib.request
import urllib.error

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")

def http_post(url, body, headers=None):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        return {"_error": f"HTTP {e.code}: {err[:300]}"}
    except Exception as e:
        return {"_error": str(e)}

# --- Step 1: Get OAuth2 access token ---
def get_ga4_access_token():
    """Get fresh access token using refresh token. Works for both GA4 and Ads if scopes match."""
    if not GOOGLE_REFRESH_TOKEN:
        return None
    resp = http_post("https://oauth2.googleapis.com/token", {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": GOOGLE_REFRESH_TOKEN,
        "grant_type": "refresh_token",
    })
    return resp.get("access_token")

# --- Step 2: Fetch GA4 data ---
def ga4_run_report(property_id, token, metrics, dimensions=None, days=14, limit=None, order_bys=None):
    pid = property_id if property_id.startswith("properties/") else f"properties/{property_id}"
    url = f"https://analyticsdata.googleapis.com/v1beta/{pid}:runReport"
    end = datetime.now().strftime("%Y-%m-%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    body = {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "metrics": [{"name": m} for m in metrics],
    }
    if dimensions:
        body["dimensions"] = [{"name": d} for d in dimensions]
    if limit:
        body["limit"] = str(limit)
    if order_bys:
        body["orderBys"] = order_bys

    return http_post(url, body, headers={"Authorization": f"Bearer {token}"})

def fetch_ga4_overview(token, property_id):
    """Hlavni metriky za 14 dni."""
    result = ga4_run_report(property_id, token, [
        "sessions", "totalUsers", "newUsers", "bounceRate",
        "averageSessionDuration", "screenPageViews", "conversions",
        "purchaseRevenue", "engagedSessions", "eventCount",
        "engagementRate"
    ])
    if result.get("_error"):
        return result
    rows = result.get("rows", [])
    if not rows:
        return {}
    vals = rows[0].get("metricValues", [])
    def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
    return {
        "sessions": int(v(0)), "totalUsers": int(v(1)), "newUsers": int(v(2)),
        "bounceRate": round(v(3), 2), "avgSessionDuration": round(v(4), 1),
        "pageViews": int(v(5)), "conversions": int(v(6)),
        "revenue": round(v(7), 2), "engagedSessions": int(v(8)),
        "eventCount": int(v(9)), "engagementRate": round(v(10) * 100, 2),
    }

def fetch_ga4_for_interval(token, property_id, days, metrics=None, dimensions=None):
    """Fetch GA4 data pro konkretni interval."""
    if metrics is None:
        metrics = ["sessions", "totalUsers", "newUsers", "bounceRate",
                   "averageSessionDuration", "screenPageViews", "conversions",
                   "purchaseRevenue", "engagedSessions", "engagementRate"]
    result = ga4_run_report(property_id, token, metrics,
                           dimensions=dimensions, days=days,
                           order_bys=[{"metric": {"metricName": "sessions"}, "desc": True}] if dimensions else None)
    if result.get("_error"):
        return result
    rows = result.get("rows", [])
    if not dimensions:
        if not rows:
            return {}
        vals = rows[0].get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        return {
            "sessions": int(v(0)), "totalUsers": int(v(1)), "newUsers": int(v(2)),
            "bounceRate": round(v(3), 2), "avgSessionDuration": round(v(4), 1),
            "pageViews": int(v(5)), "conversions": int(v(6)),
            "revenue": round(v(7), 2), "engagedSessions": int(v(8)),
            "engagementRate": round(v(9) * 100, 2),
        }
    items = []
    for row in rows:
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        item = {dimensions[i]: dims[i].get("value", "") if i < len(dims) and dims[i] else "" for i in range(len(dimensions))}
        item["sessions"] = int(v(0))
        return items  # simplified for now
    return items

def fetch_ga4_overview_intervals(token, property_id):
    """Pre-fetch overview metriky pro vsechny intervaly (28/14/7/3 dny)."""
    intervals = {}
    for days in [28, 14, 7, 3]:
        data = fetch_ga4_for_interval(token, property_id, days)
        if not data.get("_error"):
            intervals[str(days)] = data
    return intervals

def fetch_ga4_daily_trend(token, property_id, days=14):
    """Denni trend navstev a konverzi."""
    result = ga4_run_report(property_id, token,
        ["sessions", "totalUsers", "screenPageViews", "conversions", "purchaseRevenue"],
        dimensions=["date"], days=days)
    if result.get("_error"):
        return []
    trend = []
    for row in result.get("rows", []):
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        trend.append({
            "date": dims[0].get("value", "") if dims else "",
            "sessions": int(v(0)), "users": int(v(1)),
            "pageViews": int(v(2)), "conversions": int(v(3)),
            "revenue": round(v(4), 2),
        })
    return sorted(trend, key=lambda x: x["date"])

def fetch_ga4_traffic_sources(token, property_id, days=14):
    """Zdroje navstevnosti podle kanalu."""
    result = ga4_run_report(property_id, token,
        ["sessions", "totalUsers", "bounceRate", "conversions"],
        dimensions=["sessionDefaultChannelGroup"], days=days,
        order_bys=[{"metric": {"metricName": "sessions"}, "desc": True}])
    if result.get("_error"):
        return []
    sources = []
    for row in result.get("rows", []):
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        sources.append({
            "channel": dims[0].get("value", "Unknown") if dims else "Unknown",
            "sessions": int(v(0)), "users": int(v(1)),
            "bounceRate": round(v(2), 2), "conversions": int(v(3)),
        })
    return sources

def fetch_ga4_top_pages(token, property_id, days=14, limit=10):
    """Nejnavstevovanejsi stranky."""
    result = ga4_run_report(property_id, token,
        ["screenPageViews", "sessions", "averageSessionDuration"],
        dimensions=["pageTitle", "pagePath"], days=days, limit=limit,
        order_bys=[{"metric": {"metricName": "screenPageViews"}, "desc": True}])
    if result.get("_error"):
        return []
    pages = []
    for row in result.get("rows", []):
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        pages.append({
            "title": dims[0].get("value", "") if len(dims) > 0 else "",
            "path": dims[1].get("value", "") if len(dims) > 1 else "",
            "views": int(v(0)), "sessions": int(v(1)),
            "avgDuration": round(v(2), 1),
        })
    return pages

def fetch_ga4_devices(token, property_id, days=14):
    """Rozdeleni podle zarizeni."""
    result = ga4_run_report(property_id, token,
        ["sessions", "totalUsers", "bounceRate", "conversions"],
        dimensions=["deviceCategory"], days=days)
    if result.get("_error"):
        return []
    devices = []
    for row in result.get("rows", []):
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        devices.append({
            "device": dims[0].get("value", "Unknown") if dims else "Unknown",
            "sessions": int(v(0)), "users": int(v(1)),
            "bounceRate": round(v(2), 2), "conversions": int(v(3)),
        })
    return devices

def fetch_ga4_geo(token, property_id, days=14, limit=10):
    """Rozdeleni podle zeme."""
    result = ga4_run_report(property_id, token,
        ["sessions", "totalUsers", "conversions"],
        dimensions=["country"], days=days, limit=limit,
        order_bys=[{"metric": {"metricName": "sessions"}, "desc": True}])
    if result.get("_error"):
        return []
    geo = []
    for row in result.get("rows", []):
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        geo.append({
            "country": dims[0].get("value", "Unknown") if dims else "Unknown",
            "sessions": int(v(0)), "users": int(v(1)),
            "conversions": int(v(2)),
        })
    return geo

def fetch_ga4_today_vs_yesterday(token, property_id):
    """Dnes vs vcera."""
    end = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    day_before = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")

    result = ga4_run_report(property_id, token,
        ["sessions", "totalUsers", "screenPageViews", "conversions"],
        dimensions=["date"], days=2)
    if result.get("_error"):
        return None

    today_data = {"sessions": 0, "users": 0, "pageViews": 0, "conversions": 0}
    yesterday_data = dict(today_data)

    for row in result.get("rows", []):
        dims = row.get("dimensionValues", [])
        vals = row.get("metricValues", [])
        date = dims[0].get("value", "") if dims else ""
        def v(i): return float(vals[i].get("value", 0)) if len(vals) > i else 0
        d = {"sessions": int(v(0)), "users": int(v(1)),
             "pageViews": int(v(2)), "conversions": int(v(3))}
        if date == end:
            yesterday_data = d
        elif date == yesterday:
            today_data = d

    return {"today": today_data, "yesterday": yesterday_data}

# --- Step 3: Fetch Google Ads data ---
def get_ads_access_token():
    """Same refresh token, same client — just refresh again if needed."""
    return get_ga4_access_token()

def ads_query(customer_id, query, token):
    """Run GAQL query against Google Ads REST API."""
    cid = customer_id.replace("-", "")
    url = f"https://googleads.googleapis.com/v17/customers/{cid}/googleAds:search"
    headers = {
        "Authorization": f"Bearer {token}",
        "developer-token": GOOGLE_ADS_DEV_TOKEN,
    }
    if GOOGLE_ADS_LOGIN_CID:
        headers["login-customer-id"] = GOOGLE_ADS_LOGIN_CID
    return http_post(url, {"query": query, "pageSize": 10000}, headers=headers)

def fetch_ads_campaigns(token):
    """Fetch campaigns under MCC account."""
    if not GOOGLE_ADS_LOGIN_CID:
        log("  Ads: GOOGLE_ADS_LOGIN_CUSTOMER_ID not set — skipping")
        return []
    if not GOOGLE_ADS_DEV_TOKEN:
        log("  Ads: GOOGLE_ADS_DEVELOPER_TOKEN not set — skipping")
        return []

    result = ads_query(GOOGLE_ADS_LOGIN_CID, """
        SELECT
            customer_client.id,
            customer_client.descriptive_name
        FROM customer_client
        WHERE customer_client.manager = false
            AND customer_client.status != 'CANCELED'
        LIMIT 20
    """, token)
    if result.get("_error"):
        log(f"  Ads child accounts error: {result['_error']}")
        return []

    results_list = result.get("results", [])
    log(f"  Ads: found {len(results_list)} child accounts under MCC {GOOGLE_ADS_LOGIN_CID}")

    accounts = []
    for row in results_list:
        cc = row.get("customerClient", {})
        cid = str(cc.get("id", ""))
        name = cc.get("descriptiveName", f"Account {cid}")
        if cid:
            accounts.append({"id": cid, "name": name})

    if not accounts:
        log("  Ads: no non-manager child accounts found")
        return []

    # Get campaigns for each account
    campaigns = []
    for acc in accounts[:5]:
        acc_result = ads_query(acc["id"], """
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign_budget.amount_micros,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.ctr
            FROM campaign
            WHERE segments.date DURING LAST_14_DAYS
            ORDER BY metrics.cost_micros DESC
            LIMIT 20
        """, token)
        if acc_result.get("_error"):
            log(f"  Ads: account {acc['name']} query error: {acc_result['_error']}")
            continue
        acc_results = acc_result.get("results", [])
        log(f"  Ads: account {acc['name']} — {len(acc_results)} campaigns")
        for row in acc_results:
            c = row.get("campaign", {})
            m = row.get("metrics", {})
            budget = row.get("campaignBudget", {})
            campaigns.append({
                "account": acc["name"],
                "account_id": acc["id"],
                "id": str(c.get("id", "")),
                "name": c.get("name", ""),
                "status": c.get("status", ""),
                "budget_kc": round(float(budget.get("amountMicros", 0)) / 1_000_000, 2),
                "impressions": int(m.get("impressions", 0)),
                "clicks": int(m.get("clicks", 0)),
                "cost_kc": round(float(m.get("costMicros", 0)) / 1_000_000, 2),
                "conversions": round(float(m.get("conversions", 0)), 1),
                "ctr": round(float(m.get("ctr", 0)) * 100, 2),
            })
    log(f"  Ads: total {len(campaigns)} campaigns fetched across {len(accounts)} accounts")
    return campaigns

# --- Main ---
def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument("--mock", action="store_true", help="Use mock/demo data even if credentials exist")
    args = parser.parse_args()

    analytics = {
        "updated_at": datetime.now().isoformat(),
        "source": "mock",
        "mock_reason": "",
        "websites": {},
        "ads": {"campaigns": [], "alerts": [], "total_cost_kc": 0, "total_clicks": 0, "total_conversions": 0, "active_count": 0}
    }

    token = None
    if not args.mock and GOOGLE_CLIENT_ID and GOOGLE_REFRESH_TOKEN:
        if not args.quiet:
            log("Ziskavam access token...")
        token = get_ga4_access_token()
        if token:
            analytics["source"] = "live"
        else:
            analytics["mock_reason"] = "Refresh token expired — run OAuth flow to get new token"

    if not token and not args.mock:
        analytics["mock_reason"] = analytics.get("mock_reason") or "Google credentials not configured"

    # Set up demo data for websites when no live data
    for domain, cfg in GA4_PROPERTIES.items():
        pid = cfg["property_id"]
        site_data = {
            "ga4_id": cfg["ga4_id"],
            "property_id": pid,
            "account_id": cfg.get("account_id", pid),
            "links": {
                "ga4": ga4_link(pid),
                "gtm": gtm_link(cfg.get("account_id", pid)),
                "ads": ads_link(),
            },
        }
        if token:
            if not args.quiet:
                log(f"  GA4: {domain}...")
            overview_intervals = fetch_ga4_overview_intervals(token, pid)
            trend = fetch_ga4_daily_trend(token, pid, days=28)
            tdy = fetch_ga4_today_vs_yesterday(token, pid)
            traffic = fetch_ga4_traffic_sources(token, pid)
            pages = fetch_ga4_top_pages(token, pid)
            devices = fetch_ga4_devices(token, pid)
            geo = fetch_ga4_geo(token, pid)
            site_data.update({
                "overview_intervals": overview_intervals,
                "overview": overview_intervals.get("14", overview_intervals.get("28", {})),
                "daily_trend": trend,
                "today_vs_yesterday": tdy,
                "traffic_sources": traffic,
                "top_pages": pages,
                "devices": devices,
                "geo": geo,
            })
        else:
            site_data["needs_credentials"] = True
        analytics["websites"][domain] = site_data

    # Google Ads data
    if token and GOOGLE_ADS_DEV_TOKEN:
        if not args.quiet:
            log("  Google Ads: fetching campaigns...")
            log(f"  Ads developer token: {'set' if GOOGLE_ADS_DEV_TOKEN else 'MISSING'}")
            log(f"  Ads login CID: {'set' if GOOGLE_ADS_LOGIN_CID else 'MISSING'}")
        campaigns = fetch_ads_campaigns(token)
        analytics["ads"]["campaigns"] = campaigns
        analytics["ads"]["total_cost_kc"] = round(sum(c.get("cost_kc", 0) for c in campaigns), 2)
        analytics["ads"]["total_clicks"] = sum(c.get("clicks", 0) for c in campaigns)
        analytics["ads"]["total_conversions"] = round(sum(c.get("conversions", 0) for c in campaigns), 1)
        analytics["ads"]["active_count"] = sum(1 for c in campaigns if c.get("status") == "ENABLED")
    else:
        if not token:
            log("  Ads: skipped — no access token")
        elif not GOOGLE_ADS_DEV_TOKEN:
            log("  Ads: skipped — no developer token")

    (SCRIPT_DIR / "analytics.json").write_text(
        json.dumps(analytics, ensure_ascii=False, indent=2))

    update_data_js()

    if not args.quiet:
        sites = len(analytics["websites"])
        ads_count = len(analytics["ads"]["campaigns"])
        status = "LIVE" if token else "MOCK"
        log(f"Done: {status} — {sites} GA4 sites, {ads_count} Ads campaigns → analytics.json + data.js")

def update_data_js():
    """Refresh data.js so dashboard picks up analytics changes."""
    data_js_path = SCRIPT_DIR / "data.js"
    projects_path = SCRIPT_DIR / "projects.json"
    costs_path = SCRIPT_DIR / "costs.json"
    analytics_path = SCRIPT_DIR / "analytics.json"

    projects_data = {}
    costs_data = {}
    analytics_data = {}

    if projects_path.exists():
        projects_data = json.loads(projects_path.read_text())
    if costs_path.exists():
        costs_data = json.loads(costs_path.read_text())
    if analytics_path.exists():
        analytics_data = json.loads(analytics_path.read_text())

    data_js = "window.__MILO_DATA__ = {\n"
    data_js += f'  "projects": {json.dumps(projects_data, ensure_ascii=False)},\n'
    data_js += f'  "costs": {json.dumps(costs_data, ensure_ascii=False)},\n'
    data_js += f'  "analytics": {json.dumps(analytics_data, ensure_ascii=False)}\n'
    data_js += "};"
    data_js_path.write_text(data_js)

if __name__ == "__main__":
    main()
