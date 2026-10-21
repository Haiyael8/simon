# תוכנית – Milestone 1: בסיס אפליקציה ושני מסכים מעוצבים

> מקורות: `MILESTONES.md` (Milestone 1), `ARCHITECTURE.md` (§1, §2.4, ADR-1, ADR-8), `DESIGN.md` (§1.1, §1.2, §1.4, §2), ותמונות ה-spec. אין בתוכנית זו לוגיקת משחק, אודיו, היסטוריה או PWA — אלה באבני דרך הבאות.

## תנאי מקדים (לפני הבנייה)
- **Node.js אינו מותקן במחשב** (הפקודות `node`/`npm` לא נמצאו). בלי זה אי אפשר לבנות. יש להתקין Node.js גרסת **LTS** מ-nodejs.org (המשתמש מבצע; אעביר אותו צעד אחר צעד), ולפתוח מחדש את האפליקציה/הטרמינל.
- ה-repo המקומי כבר מחובר ל-`https://github.com/Haiyael8/simon.git`. אין צורך בפעולת git באבן דרך זו (commit רק לפי בקשה).

## מבנה קבצים שייווצר (בשורש הפרויקט)
```
.nvmrc                      גרסת Node ננעלת (LTS מותקנת)
package.json                scripts: dev, build, test, typecheck; engines
package-lock.json
tsconfig.json (+ tsconfig.node.json)
vite.config.ts              base: "/simon/" (ADR-8), plugin react, הגדרת vitest (jsdom)
index.html                  lang="he" dir="rtl", viewport-fit=cover, theme-color #0A1628, title "סיימון"
.env.example                לא נדרש (אין משתני סביבה) — לא ייווצר
src/
  main.tsx                  נקודת כניסה; ייבוא גופן + CSS
  App.tsx                   App Shell: state של מסך פעיל ("home" | "about") + ניווט
  styles/
    tokens.css              CSS Variables: צבעים (Background/Surface/Border וארבעת הצבעים...), ריווח 8/12/16/24, רדיוסים, גופנים
    global.css              reset, RTL, user-select/touch-action, safe-area
  game/
    colors.ts               הגדרת 4 הצבעים: מזהה, שם עברי נגיש, grid-area, צבע (מקור אמת ללוח)
  components/
    Board.tsx (+ board.css) לוח Simon: 4 כפתורי <button> בגריד 2×2 עגול (ADR-1)
    NavBar.tsx              פס ניווט תחתון "בית" / "אודות"
  screens/
    HomeScreen.tsx          כותרת "סיימון", "שלב 1 מתוך 10", לוח, כפתור "התחל משחק"
    AboutScreen.tsx         כותרת "אודות", כרטיס "על המשחק", "10 המשחקים האחרונים", חיווי ריק
  test/
    setup.ts                jest-dom
    App.test.tsx            בדיקות Render וניווט
```
תלויות: `react`, `react-dom`, `@fontsource/heebo`; Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react*`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`. (לא מתקינים `canvas-confetti` ו-`vite-plugin-pwa` עכשיו — נחוצים רק באבני דרך 2 ו-5.)

## פירוט לפי נושא

### 1. הקמת הפרויקט
- Scripts: `dev` (vite), `build` (`tsc --noEmit && vite build`), `test` (`vitest run`), `typecheck` (`tsc --noEmit`).
- `.nvmrc` ושדה `engines` לפי גרסת ה-LTS שתותקן.
- `.gitignore` קיים וכבר מכסה `node_modules`, `dist`, `.env`; לא מחליפים אותו. בסוף: מעדכן ב-`CLAUDE.md` את "פקודות הרצה" (dev: `npm run dev`, כתובת `http://localhost:5173/simon/`; test: `npm run test`).

### 2. התאמה למובייל (ARCHITECTURE §2.4)
- `<meta viewport>` עם `width=device-width, initial-scale=1, viewport-fit=cover`; `theme-color` = `#0A1628`.
- `touch-action: manipulation` ו-`user-select: none` על הלוח (ורצוי גם `-webkit-tap-highlight-color: transparent`).
- פס הניווט: `padding-bottom: env(safe-area-inset-bottom)`; גובה האפליקציה `100dvh`, בלי גלילה אופקית (`overflow-x: hidden`, `max-width: 100%`).
- הפריסה מכוונת לרוחב טלפון (~360–430px). בדפדפן במחשב: עמודה ממורכזת ברוחב מקסימלי ~480px על אותו רקע.

### 3. App Shell וניווט
- `App` מחזיק `screen` ב-`useState` (בשלב זה בלבד; ה-State של המשחק יתווסף ב-M2 באותו מקום). ללא Router וללא טעינת דף.
- מעבר = החלפת המסך המוצג; סימון הלשונית הפעילה (`aria-current="page"`), גלולה כחולה (`#00A3FF`) לפעילה, `Soft Gray` ללא פעילה (DESIGN §1.4).
- הערה: ב-RTL הלשונית "בית" מימין ו"אודות" משמאל (כמו ב-Mockups).

### 4. מסך בית (DESIGN §1.1, מצב "לפני תחילת משחק")
- כותרת "סיימון" (H1 32px Bold), מתחתיה "שלב 1 מתוך 10" (H3), ללא Progress Bar.
- לוח עגול: מיכל `direction: ltr`, גריד 2×2 עם `gap` כהה (צלב אחיד), `border-radius: 50%` + `overflow: hidden`. מיקום: ירוק למעלה-שמאל, אדום למעלה-ימין, צהוב למטה-שמאל, כחול למטה-ימין (Mockups גוברים — DESIGN §1.1). כל רבע `<button aria-label>` בעברית ("ירוק", "אדום", "צהוב", "כחול"); דיסק מרכזי כהה **ריק** (דקורטיבי, `pointer-events: none`, `aria-hidden`).
- באבן דרך זו הרבעים אינם מפעילים כלום (אין משחק); אין לוגיקה ואין צליל.
- כפתור ראשי כחול רחב "התחל משחק" (לא עושה דבר ב-M1; ללא הודעה מומצאת).
- ללא אייקוני הגדרות/סאונד, ללא הקשת הדקורטיבית שבמוקאפ (DESIGN §2.7).

### 5. מסך אודות (DESIGN §1.2)
- כותרת "אודות"; כרטיס "על המשחק" (Surface + Border) עם תיאור והוראות קצרות בעברית. נוסח (ה-PRD משאיר את הניסוח ליישום): "זכור את רצף הצבעים שמוצג. לחץ על הצבעים באותו סדר. נסה להגיע עד שלב 10!".
- כותרת "10 המשחקים האחרונים" וחיווי ריק: "עדיין אין משחקים שמורים".
- **ללא** כפתור "מחק היסטוריה" (מוצג רק כשיש רשומות — M4).
- תוכן גולל בתוך העמוד אם נדרש; פס הניווט נשאר קבוע.

### 6. שפה חזותית
- `tokens.css` עם כל ה-HEX מ-DESIGN §2.1 (Background `#0A1628`, Surface `#12213A`, Border `#1E3556`, ארבעת הצבעים, Charcoal, Soft Gray, White), ריווח 8/12/16/24.
- גופן Heebo דרך `@fontsource/heebo` (רק משקלים 400, 600, 700, גם `hebrew` + `latin` subsets), Fallback `Arial, sans-serif`; ללא Google Fonts.
- כפתור ראשי: כחול מלא, פינות מעוגלות, טקסט לבן 16px Semibold, צל רך. כרטיסים: Surface + גבול עדין + פינות מעוגלות. ניגודיות טקסט בהיר על הרקע הכהה.

### 7. בדיקות אוטומטיות (Vitest + RTL)
1. Render: מוצגים "סיימון", "שלב 1 מתוך 10", כפתור "התחל משחק" וארבעה כפתורי רבע עם שמות נגישים בעברית.
2. ניווט: לחיצה על "אודות" מציגה "על המשחק" ו"עדיין אין משחקים שמורים"; חזרה ל"בית" מציגה את הלוח; אין מסך שלישי.
3. מבנה: ל-`document` יש `lang="he"` ו-`dir="rtl"` (נבדק על `index.html`/על שורש האפליקציה), ואין כפתור "מחק היסטוריה".

## אימות מול ה-Definition of Done (ייעשה בבנייה)
| DoD | איך נבדק |
|---|---|
| build + typecheck + בדיקות | `npm run typecheck`, `npm run build`, `npm run test` |
| מעבר מסכים בלי רענון, ללא מסך שלישי | בדיקת RTL + דפדפן מובנה (אין ניווט/טעינה מחדש) |
| 4 אזורי לוח במקומות הנכונים, שלב, כפתור; אודות עם הסבר והודעה ריקה | צילום מסך בדפדפן במצב mobile מול ה-Mockups |
| עברית/RTL, בלי גלילה אופקית | בדיקת `scrollWidth <= clientWidth` ב-375px |
| ללא יכולות מעבר ל-PRD / ללא Backend | סקירת קוד |
| שמות נגישים, safe-area, ניגודיות | בדיקת `aria-label`, `env(safe-area-inset-bottom)` ב-CSS, בדיקת ניגודיות ידנית |

## סיכונים והחלטות
- **Node חסר** — חוסם בנייה עד שהמשתמש מתקין (ראה תנאי מקדים).
- בחירה פשוטה: מצב המסך ב-`useState` ב-`App` (בלי Reducer עדיין) — כדי לא לסבך; ב-M2 מוסיפים `useGame` באותו מקום.
- אין סתירות ב-spec שדורשות עצירה. הידועות (סדר צבעים, "התחל משחק" במקום "התחל", "שלב 1") כבר הוכרעו ב-DESIGN §2.7.
