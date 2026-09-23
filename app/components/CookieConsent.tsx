"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "htc-israel-cookie-consent-v1";

interface CookiePrefs {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePrefs = {
  necessary: true,
  functional: true,
  analytics: false,
  marketing: false,
};

function readStored(): CookiePrefs | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return stored && typeof stored === "object" ? { ...DEFAULT_PREFS, ...stored } : null;
  } catch {
    return null;
  }
}

function updateGoogleConsent(prefs: CookiePrefs) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("consent", "update", {
    security_storage: "granted",
    functionality_storage: prefs.functional ? "granted" : "denied",
    personalization_storage: prefs.functional ? "granted" : "denied",
    analytics_storage: prefs.analytics ? "granted" : "denied",
    ad_storage: prefs.marketing ? "granted" : "denied",
    ad_user_data: prefs.marketing ? "granted" : "denied",
    ad_personalization: prefs.marketing ? "granted" : "denied",
  });
}

export default function CookieConsent() {
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<CookiePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setPrefs(stored);
      setSaved(true);
      updateGoogleConsent(stored);
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const save = (next: Partial<CookiePrefs>) => {
    const merged: CookiePrefs = { ...DEFAULT_PREFS, ...next, necessary: true };
    setPrefs(merged);
    setSaved(true);
    setDialogOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {}
    updateGoogleConsent(merged);
  };

  const openDialog = () => {
    setDraft(prefs);
    setDialogOpen(true);
  };

  return (
    <div className="cookie-consent">
      {saved && (
        <button className="site-control cookie-consent__trigger" type="button" aria-label="פתיחת הגדרות עוגיות" onClick={openDialog}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 16h14"/><circle cx="9" cy="8" r="2"/><circle cx="15" cy="16" r="2"/></svg>
        </button>
      )}
      {!saved && (
        <aside className="cookie-consent__banner" aria-labelledby="cookieBannerTitle">
          <div className="cookie-consent__copy">
            <small>הפרטיות שלכם</small>
            <h2 id="cookieBannerTitle">אתם שולטים בעוגיות</h2>
            <p>אנחנו משתמשים בעוגיות חיוניות להפעלת האתר. עוגיות נוספות יופעלו רק לפי הבחירה שלכם.</p>
            <a href="/privacy">למדיניות הפרטיות</a>
          </div>
          <div className="cookie-consent__actions">
            <button data-cookie-action="accept" type="button" onClick={() => save({ functional: true, analytics: true, marketing: true })}>קבל הכול</button>
            <button data-cookie-action="necessary" type="button" onClick={() => save({ functional: false, analytics: false, marketing: false })}>חיוניות בלבד</button>
            <button data-cookie-action="manage" type="button" onClick={openDialog}>ניהול העדפות</button>
          </div>
        </aside>
      )}
      <div className="site-dialog-backdrop" hidden={!dialogOpen} onClick={(e) => { if (e.target === e.currentTarget) setDialogOpen(false); }}>
        <section className="site-dialog cookie-consent__dialog" role="dialog" aria-modal="true" aria-labelledby="cookieDialogTitle">
          <header>
            <div><small>HTC ISRAEL · PRIVACY</small><h2 id="cookieDialogTitle">ניהול העדפות עוגיות</h2></div>
            <button className="site-dialog__close" type="button" aria-label="סגירת הגדרות עוגיות" onClick={() => setDialogOpen(false)}>×</button>
          </header>
          <div className="site-dialog__body">
            <label className="site-switch-row">
              <span><b>עוגיות חיוניות</b><small>נדרשות לפעולת האתר, הסל והעדפות האבטחה</small></span>
              <input type="checkbox" checked disabled /><i aria-hidden="true"></i>
            </label>
            <label className="site-switch-row">
              <span><b>עוגיות פונקציונליות</b><small>זוכרות בחירות ומשפרות את חוויית השימוש</small></span>
              <input type="checkbox" checked={draft.functional} onChange={(e) => setDraft((d) => ({ ...d, functional: e.target.checked }))} /><i aria-hidden="true"></i>
            </label>
            <label className="site-switch-row">
              <span><b>עוגיות אנליטיות</b><small>מסייעות להבין כיצד משתמשים באתר</small></span>
              <input type="checkbox" checked={draft.analytics} onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))} /><i aria-hidden="true"></i>
            </label>
            <label className="site-switch-row">
              <span><b>עוגיות שיווקיות</b><small>מאפשרות מדידה והתאמה של מסרים שיווקיים</small></span>
              <input type="checkbox" checked={draft.marketing} onChange={(e) => setDraft((d) => ({ ...d, marketing: e.target.checked }))} /><i aria-hidden="true"></i>
            </label>
          </div>
          <footer>
            <button className="cookie-consent__necessary" type="button" onClick={() => save({ functional: false, analytics: false, marketing: false })}>
              חיוניות בלבד
            </button>
            <button className="cookie-consent__save" type="button" onClick={() => save(draft)}>שמירת הבחירה</button>
          </footer>
        </section>
      </div>
    </div>
  );
}
