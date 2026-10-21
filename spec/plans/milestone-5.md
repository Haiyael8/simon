# תוכנית – Milestone 5: PWA, אייקונים ועבודה Offline

מקורות: PRD §4.5 ומקרי הקצה, ARCHITECTURE §2.4 (iOS), §2.7, ADR-6/7/8/9, DESIGN §1.5 (הודעת עדכון) ו-§2.4 (App Icon), MILESTONES (Milestone 5). נקודת המוצא: הקוד של Milestone 4 (`main.tsx`, `App.tsx`, `vite.config.ts`, `index.html`).

## 1. מה בונים, בפשטות
האתר הופך לאפליקציה שאפשר להתקין בטלפון ושממשיכה לעבוד גם בלי אינטרנט: נוצר אייקון, נוספת "רשימת קניות" של כל הקבצים שהדפדפן שומר מראש (כולל הגופן), ונוספת הודעה קטנה "גרסה חדשה זמינה" שמופיעה רק כשאין משחק פעיל. **אין** פריסה ל-GitHub Pages (Milestone 6) ו**אין** שינוי בלוגיקת המשחק או ההיסטוריה.

## 2. קבצים
| קובץ | שינוי |
|---|---|
| `public/icon.svg` (חדש) | אייקון מקור: לוח Simon עגול בארבעת הצבעים, מרכז כהה, רקע `#0A1628`, בלי טקסט; הלוח ~78% מהקנבס (בתוך ה-Safe Zone של Maskable) |
| `pwa-assets.config.ts` (חדש) + סקריפט `generate-pwa-assets` ב-`package.json` | יצירת `pwa-64/192/512`, `maskable-icon-512x512`, `apple-touch-icon-180x180`, `favicon.ico` ל-`public/` (ADR-7); הקבצים שנוצרו נשמרים ב-Repo |
| `package.json` | תלויות פיתוח חדשות: `vite-plugin-pwa`, `@vite-pwa/assets-generator` (שרשרת Workbox מגיעה איתן) |
| `vite.config.ts` | `VitePWA` עם `strategies: 'generateSW'`, `registerType: 'prompt'`, `injectRegister: false`, Manifest מלא, `globPatterns` ל-html/js/css/woff2/png/svg/ico, `navigateFallback` בתוך ה-scope; קבוע `BASE` משותף ל-`base`, `start_url` ו-`scope` (ADR-8) |
| `index.html` | `<link rel="icon">`, `apple-touch-icon`, `apple-mobile-web-app-capable` (+ title/status-bar style) |
| `src/pwa/useUpdatePrompt.ts` (חדש) | Hook קטן: רושם את ה-SW (`registerSW` מ-`virtual:pwa-register`, `immediate: true`), מחזיק `needRefresh`, ומחזיר `refresh()` שקורא ל-`updateServiceWorker(true)` |
| `src/components/UpdateSnackbar.tsx` + `update.css` (חדשים) | הרצועה "גרסה חדשה זמינה" + כפתור משני "רענן" לפי DESIGN §1.5, מעל פס הניווט, בלי כפתור סגירה |
| `src/App.tsx` | משלב את ה-Hook; מציג את ההודעה רק כש-`game.state.status` הוא `idle`/`won`/`lost` |
| `src/vite-env.d.ts` / `tsconfig.json` | טיפוסי `vite-plugin-pwa/client` |
| `src/test/update.test.tsx` (חדש) | בדיקות (§5) |
| `CLAUDE.md` / `.gitignore` | הוספת `dev-dist` ל-`.gitignore` אם נוצר; פקודת `npm run preview` לבדיקה |

## 3. הגדרות עיקריות
- **Manifest:** `name`/`short_name` = `Simon`, `id: '/simon/app'`, `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `orientation: 'portrait'`, `theme_color`/`background_color` = `#0A1628`, `start_url`/`scope` = `/simon/`, אייקונים 192, 512 (`any`) ו-512 (`maskable`).
- **Precache:** כל קבצי ה-Build, כולל קבצי הגופן Heebo שהמשקלים שבשימוש בלבד (הם כבר מיובאים מ-`@fontsource`, ולכן נארזים). הצלילים מיוצרים ב-Web Audio בקוד, ולכן אין קבצי אודיו. אין שום בקשה לכתובת חיצונית.
- **עדכון (ADR-6):** בלי `skipWaiting`/`clientsClaim` אוטומטיים. ה-SW החדש ממתין עד לחיצה על "רענן". ההודעה נעלמת מעצמה כשמתחיל משחק (כי התנאי הוא על `status`) וחוזרת בסיומו אם העדכון עדיין ממתין. משחק פעיל או מושהה לעולם לא מרוענן.
- **Dev:** ה-SW לא מופעל ב-`npm run dev` (ברירת המחדל), כדי לא לבלבל את הפיתוח; הבדיקות רצות על Build.

## 4. בדיקה מקומית על Build (ידנית, בדפדפן)
1. `npm run build` ואז `npm run preview` → `http://localhost:4173/simon/`.
2. DevTools → Application: Manifest תקין, אייקונים (כולל Maskable), Service Worker פעיל, Cache Storage מכיל את הקבצים (כולל הגופן).
3. Network: אין בקשות לדומיין חיצוני.
4. סימון Offline (או עצירת השרת) ורענון: האפליקציה נפתחת, משחקים, צלילים, ניווט בין המסכים, והיסטוריה שמורה.
5. הודעת עדכון: שינוי טקסט קטן, Build חדש, ובדיקה שההודעה מופיעה רק ב-idle/won/lost ושרענון קורה רק בלחיצה. מה שלא ניתן לבדוק מקומית (התקנה בפועל בטלפון, iOS) מדווח כלא נבדק ועובר ל-Milestone 6.

## 5. בדיקות אוטומטיות
- ההודעה מוצגת כש-`needRefresh` ו-`status` ב-`idle`/`won`/`lost`, ומוסתרת ב-`presenting`/`awaitingInput`/`paused`.
- לחיצה על "רענן" קוראת ל-`updateServiceWorker(true)` פעם אחת; בלי לחיצה אין קריאה.
- ה-Hook של ה-SW מדומה (Mock) ב-Vitest; בדיקות המשחק וההיסטוריה הקיימות ממשיכות לעבור.

## 6. סיכונים / החלטות
- גרסאות החבילות החדשות (Vite 8) — אם `vite-plugin-pwa` לא תואמת, אעצור ואדווח לפני עקיפה.
- כל סוף-שלב: `npm run typecheck`, `npm run test`, `npm run build`.
