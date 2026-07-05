#!/usr/bin/env python3
"""
sync_from_zoho.py
Syncs practitioner profile data from Zoho CRM into practitioners_data.json.

Reads Zoho raw data from /tmp/zoho_raw_data.json (written by parent agent).
Preserves: locations, fees, medicare_rebate, location_notes, working_hours,
           note, qualifications, link_to_bio, id, availability fields, alert (if already set).
Updates: short_bio, bio, pronouns, gender, presentations, modalities, client_types,
         age_range, therapist_type, billing_types, languages, religions_groups, style, alert.
"""
import json, re, unicodedata
from datetime import datetime

# ─── Paths ─────────────────────────────────────────────────────────────────
ZOHO_DATA   = '/tmp/zoho_raw_data.json'
APP_DATA    = '/agent/home/practitioners_data.json'
APP_TS      = '/agent/home/apps/practitioner-availability/practitionersData.ts'
DEPLOY_TS   = '/agent/home/deploy/src/practitionersData.ts'
RESULT_FILE = '/tmp/zoho_sync_result.json'
CACHE_FILE  = '/agent/home/apps/practitioner-availability/.tasklet-build-cache.json'

# ─── Name mapping: Zoho Full_Name → App name ───────────────────────────────
NAME_MAP = {
    "Pete Steele":               "Peter Steele",
    "Cristina Jiménez":          "Cristina Jimenez",
    "Dr. Krista De Castella":    "Dr Krista De Castella",
    "Dr. Stephanie Stewart":     "Stephanie Stewart",
    "Dr. Maddie Brygel":         "Dr Maddie Brygel",
    "Nicholas Burden":           "Nick Burden",
    "Mr. Joshua Kugel":          "Joshua Kugel",
    "Christine Deftereos":       "Dr Christine Deftereos",
}

# ─── Billing type simplification ────────────────────────────────────────────
BILLING_MAP = {
    "medicare rebate":                        "Medicare Rebate",
    "national disability insurance scheme":   "NDIS",
    "ndis":                                   "NDIS",
    "self funded":                            "Self Funded",
    "private paying":                         "Self Funded",
    "third party funded":                     "Third Party",
    "third party":                            "Third Party",
    "employer funded":                        "EAP",
    "employee assistance":                    "EAP",
    "eap":                                    "EAP",
    "worksafe":                               "WorkSafe",
    "workcover":                              "WorkSafe",
}

def simplify_billing(raw_list):
    seen = set()
    result = []
    for item in raw_list:
        lower = item.lower()
        matched = None
        for key, val in BILLING_MAP.items():
            if key in lower:
                matched = val
                break
        if not matched:
            matched = item.strip()
        if matched not in seen:
            seen.add(matched)
            result.append(matched)
    return result

# ─── Gender inference from pronouns ─────────────────────────────────────────
def infer_gender(pronouns):
    if not pronouns:
        return None
    p = pronouns.lower()
    if "she" in p:  return "Female"
    if "he" in p:   return "Male"
    if "they" in p: return "Non-binary"
    return None

# ─── Strip title from name (Dr., Mr., Ms., etc.) ────────────────────────────
def strip_title(full_name):
    return re.sub(r'^(Dr\.|Mr\.|Ms\.|Mrs\.|Mx\.)\s*', '', full_name or '').strip()

# ─── Normalize unicode (remove accents) ─────────────────────────────────────
def normalize_name(name):
    nfkd = unicodedata.normalize('NFKD', name)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))

# ─── Clean presentations string ─────────────────────────────────────────────
def clean_presentations(pipe_str):
    if not pipe_str:
        return ""
    items = [s.strip() for s in pipe_str.split(" | ") if s.strip()]
    seen = set()
    deduped = []
    for item in items:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped  # return as list

# ─── Clean modalities string ─────────────────────────────────────────────────
def clean_modalities(pipe_str):
    if not pipe_str:
        return ""
    # Zoho may use " | " or " / " as separator — handle both
    if " | " in pipe_str:
        items = [s.strip() for s in pipe_str.split(" | ") if s.strip()]
    elif " / " in pipe_str:
        items = [s.strip() for s in pipe_str.split(" / ") if s.strip()]
    else:
        items = [pipe_str.strip()] if pipe_str.strip() else []
    seen = set()
    deduped = []
    for item in items:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped  # return as list

# ─── Build lookup from Zoho data ─────────────────────────────────────────────
def build_zoho_lookup(zoho_records):
    """Returns dict of {app_name: zoho_record} for records with useful data."""
    lookup = {}
    skip_names = {"Anna Donaldson - Client", "Anna Donaldson", "Admin PsychologyCare",
                  "Charlotte Davenport", "David Spektor", "Brygel", "Emily Fishman"}
    for rec in zoho_records:
        full = rec.get('Full_Name', '') or ''
        if not full or full in skip_names:
            continue
        # Skip records with no modalities (empty/stub records)
        if not rec.get('All_Modalities_Auto') and not rec.get('Short_Bio'):
            continue
        # Map name
        app_name = NAME_MAP.get(full, full)
        app_name = normalize_name(app_name)
        lookup[app_name] = rec
    return lookup

# ─── Change tracking ─────────────────────────────────────────────────────────
TRACKED_FIELDS = ['short_bio', 'bio', 'pronouns', 'gender', 'age_range', 'therapist_type',
                  'client_types', 'presentations', 'modalities', 'billing_types',
                  'languages', 'religions_groups', 'style', 'alert']

def diff_practitioner(old, new):
    """Return list of (field, old_val, new_val) for changed tracked fields."""
    changes = []
    for f in TRACKED_FIELDS:
        ov = old.get(f)
        nv = new.get(f)
        if ov != nv:
            changes.append((f, ov, nv))
    return changes

# ─── Apply Zoho data to one practitioner ────────────────────────────────────
def apply_zoho(practitioner, zoho):
    """Update practitioner dict with Zoho data. Returns updated dict."""
    p = dict(practitioner)

    # Short bio
    sb = zoho.get('Short_Bio')
    if sb:
        p['short_bio'] = sb.strip()

    # Bio (skip if it's just a URL)
    bio = zoho.get('Bio')
    if bio and bio.strip() and not bio.strip().startswith('http'):
        p['bio'] = bio.strip()

    # Pronouns
    pron = zoho.get('Pronouns')
    if pron:
        p['pronouns'] = pron.strip()

    # Gender (infer from pronouns; don't overwrite if already set)
    gen = infer_gender(pron)
    if gen and not p.get('gender'):
        p['gender'] = gen
    elif gen:
        p['gender'] = gen  # Always update gender to match pronouns

    # Age range (take minimum)
    ages = zoho.get('Ages') or []
    if ages:
        nums = []
        for a in ages:
            m = re.search(r'(\d+)', a)
            if m:
                nums.append(int(m.group(1)))
        if nums:
            p['age_range'] = f"{min(nums)} Yrs +"

    # Therapist type
    modality = zoho.get('Modality') or []
    if modality:
        type_map = {
            "Clinical Psychologist": "Clinical Psychologist",
            "Clinical Psychology Registra": "Clinical Psychology Registrar",
            "Psychologist": "Psychologist",
            "Counsellor": "Counsellor",
            "Psychotherapist": "Psychotherapist",
        }
        types = [type_map.get(m, m) for m in modality]
        # Prefer most qualified title
        if "Clinical Psychologist" in types:
            p['therapist_type'] = "Clinical Psychologist"
        elif "Clinical Psychology Registrar" in types:
            p['therapist_type'] = "Clinical Psychology Registrar"
        elif types:
            p['therapist_type'] = types[0]

    # Client types
    ct = zoho.get('Client_Types') or []
    if ct:
        # Normalize "Individuals" → "Individual"
        ct_clean = [c.rstrip('s') if c.lower() == 'individuals' else c for c in ct]
        p['client_types'] = ", ".join(ct_clean)

    # Presentations
    pres = clean_presentations(zoho.get('All_Presentations_Auto_Full'))
    if pres:
        p['presentations'] = pres

    # Modalities
    mods = clean_modalities(zoho.get('All_Modalities_Auto'))
    if mods:
        p['modalities'] = mods

    # Billing types
    bt = zoho.get('Billing_types') or []
    if bt:
        simplified = simplify_billing(bt)
        p['billing_types'] = ", ".join(simplified)

    # Languages
    lang = zoho.get('Languages_I_am_fluent_in')
    if lang:
        p['languages'] = lang.strip()

    # Religions/groups
    rel = zoho.get('Religions_Groups_I_have_a_strong_understanding') or []
    if rel:
        p['religions_groups'] = ", ".join(rel)

    # Style (filter out gender descriptors and non-style items)
    STYLE_EXCLUDE = {"female", "male", "non binary", "transgender", "agender"}
    style_items = zoho.get('Style_of_Therapy') or []
    style_filtered = [s for s in style_items if s.lower() not in STYLE_EXCLUDE]
    if style_filtered:
        p['style'] = ", ".join(style_filtered)

    # Alert (only update if Zoho has one; preserve existing if Zoho is null)
    alert = zoho.get('ALERT')
    if alert:
        p['alert'] = alert.strip()

    # Update last_updated
    from zoneinfo import ZoneInfo as _ZI2
    p['last_updated'] = datetime.now(_ZI2("Australia/Melbourne")).strftime('%Y-%m-%d')

    return p

# ─── Auto-bump cache version ─────────────────────────────────────────────────
def bump_cache_version():
    import os
    if os.path.exists(CACHE_FILE):
        os.remove(CACHE_FILE)
        print("  Cache invalidated (bundle will recompile)")

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Load Zoho data
    with open(ZOHO_DATA, 'r', encoding='utf-8') as f:
        zoho_records = json.load(f)
    print(f"Loaded {len(zoho_records)} Zoho records")

    zoho_lookup = build_zoho_lookup(zoho_records)
    print(f"Found {len(zoho_lookup)} usable practitioner records in Zoho")

    # Load current app data
    with open(APP_DATA, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    if isinstance(raw, list):
        practitioners = raw
    else:
        practitioners = raw.get('practitioners', raw)

    updated = []
    skipped = []
    matched_names = []
    changes_log = {}  # name → list of (field, old, new)

    for p in practitioners:
        app_name = normalize_name(p.get('name', ''))
        if app_name in zoho_lookup:
            zoho = zoho_lookup[app_name]
            p_new = apply_zoho(p, zoho)
            diffs = diff_practitioner(p, p_new)
            if diffs:
                changes_log[p.get('name')] = diffs
            updated.append(p_new)
            matched_names.append(p.get('name'))
        else:
            updated.append(p)
            skipped.append(p.get('name', '?'))

    if skipped:
        print(f"No Zoho match for: {', '.join(skipped)}")

    # Write updated data
    out_data = raw
    if isinstance(raw, list):
        out_data = updated
    else:
        out_data['practitioners'] = updated

    with open(APP_DATA, 'w', encoding='utf-8') as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)
    print(f"Updated {APP_DATA}")

    # Regenerate TypeScript files
    import subprocess, re as _re
    from datetime import datetime as dt

    with open(APP_DATA, 'r', encoding='utf-8') as f:
        final_data = json.load(f)
    if isinstance(final_data, list):
        practitioners_out = final_data
    else:
        practitioners_out = final_data.get('practitioners', final_data)

    ts_content = json.dumps(practitioners_out, ensure_ascii=False, indent=2)

    # Bump version in app.tsx
    app_tsx = '/agent/home/apps/practitioner-availability/app.tsx'
    try:
        with open(app_tsx, 'r') as f:
            tsx_text = f.read()
        m = _re.search(r'pc_practitioners_v(\d+)', tsx_text)
        if m:
            old_v = int(m.group(1))
            new_v = old_v + 1
            tsx_text = tsx_text.replace(f'pc_practitioners_v{old_v}', f'pc_practitioners_v{new_v}')
            with open(app_tsx, 'w') as f:
                f.write(tsx_text)
            print(f"  Bumped app.tsx cache: v{old_v} → v{new_v}")
        else:
            new_v = 1
    except Exception as e:
        new_v = 1
        print(f"  Could not bump app.tsx version: {e}")

    content = f"""// Auto-generated from practitioners_data.json — DO NOT EDIT MANUALLY
// Synced from Zoho CRM on {dt.now().strftime("%Y-%m-%d %H:%M")}
export const PRACTITIONERS_DATA = {ts_content} as const;

export const practitionersData = PRACTITIONERS_DATA;
export const AVAILABILITY_LAST_UPDATED: string = (globalThis as any).__AVAILABILITY_LAST_UPDATED__ ?? "";
"""

    for path in [
        '/agent/home/apps/practitioner-availability/practitionersData.ts',
        '/agent/home/deploy/src/practitionersData.ts'
    ]:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  Written {path}")

    bump_cache_version()

    # Build change summary
    changed_names = list(changes_log.keys())
    unchanged_matched = [n for n in matched_names if n not in changes_log]

    log = (f"✅ Zoho sync complete!\n"
           f"  • {len(matched_names)} practitioners matched from Zoho CRM\n"
           f"  • {len(changed_names)} had field changes: {', '.join(changed_names) if changed_names else 'none'}\n"
           f"  • {len(unchanged_matched)} unchanged: {', '.join(unchanged_matched) if unchanged_matched else 'none'}\n"
           f"  • {len(skipped)} practitioners with no Zoho match (preserved as-is): {', '.join(skipped) if skipped else 'none'}")

    print(log)

    with open(RESULT_FILE, 'w') as f:
        json.dump({
            "log": log,
            "updated": len(matched_names),
            "changed": changed_names,
            "changes_log": {name: [(f, str(o), str(n)) for f, o, n in diffs]
                            for name, diffs in changes_log.items()},
            "unchanged": unchanged_matched,
            "skipped": skipped
        }, f, indent=2)

    # Write to audit log
    AUDIT_LOG = '/agent/home/audit_log.json'
    try:
        import os as _os
        from datetime import datetime as _dt
        from zoneinfo import ZoneInfo as _ZI3
        _now = _dt.now(_ZI3("Australia/Melbourne"))
        audit = []
        if _os.path.exists(AUDIT_LOG):
            with open(AUDIT_LOG, 'r') as f:
                audit = json.load(f)
        audit.insert(0, {
            "id": _now.strftime('%Y%m%d%H%M%S'),
            "timestamp": _now.isoformat(),
            "type": "zoho_sync",
            "title": "Zoho CRM sync",
            "details": {
                "matched": len(matched_names),
                "changed": changed_names,
                "changes": {name: [(fi, str(o), str(n)) for fi, o, n in diffs]
                            for name, diffs in changes_log.items()},
                "unchanged": unchanged_matched,
                "skipped": skipped
            }
        })
        audit = audit[:200]
        with open(AUDIT_LOG, 'w') as f:
            json.dump(audit, f, indent=2)
    except Exception as e:
        print(f"⚠️  Could not write audit log: {e}")

if __name__ == '__main__':
    main()
