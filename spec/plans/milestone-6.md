# תוכנית – Milestone 6: פרסום ב-GitHub Pages ובדיקה במכשיר אמיתי

מקורות: MILESTONES (Milestone 6), ARCHITECTURE §2.9 ו-ADR-8, §2.10. נקודת המוצא: הקוד של Milestone 5 (`vite.config.ts` עם `base: '/simon/'`, `.nvmrc` = 24, ה-Repo `https://github.com/Haiyael8/simon` מחובר כ-`origin`).

## 1. מה בונים, בפשטות
כל פעם שדוחפים שינויים ל-`main`, GitHub בודק את הקוד (טיפוסים + בדיקות), בונה אותו ומפרסם לכתובת `https://haiyael8.github.io/simon/`. אם משהו נכשל — לא מתפרסם כלום. אחר כך בודקים את המשחק בטלפון אמיתי. **אין** שינוי בתכולת המוצר, בלוגיקת המשחק או בעיצוב; רק התאמות פריסה/נגישות קטנות אם הבדיקה חושפת בעיה.

## 2. קבצים
| קובץ | שינוי |
|---|---|
| `.github/workflows/deploy.yml` (חדש) | ה-Workflow: ראו §3 |
| `spec/ARCHITECTURE.md` | אם צריך — ADR קצר רק אם מתקבלת החלטה טכנית חדשה בזמן הפריסה |
| `spec/MILESTONES.md` | סימון 🟡 אחרי הבנייה (✅ עם הדחיפה/האישור) |
| `CLAUDE.md` | הוספת כתובת Production תחת "פקודות הרצה" |

לא נוסף שום קוד אפליקציה, אלא אם בדיקת הפריסה/הטלפון חושפת באג פריסה (למשל נתיב שגוי תחת `/simon/`) — אז יתוקן ויידווח.

## 3. ה-Workflow (`deploy.yml`)
- **טריגר:** `push` ל-`main`, וגם `workflow_dispatch` (הרצה ידנית מכפתור, לנוחות).
- **הרשאות מינימליות (ARCHITECTURE §2.9):** `contents: read`, `pages: write`, `id-token: write`.
- **Concurrency:** קבוצת `pages`, בלי ביטול פריסה שרצה (כמקובל ב-Pages).
- **Job `build`:** `actions/checkout` → `actions/setup-node` עם `node-version-file: .nvmrc` ו-`cache: npm` → `npm ci` → `npm run typecheck` → `npm run test` → `npm run build` → `actions/configure-pages` → `actions/upload-pages-artifact` עם `path: dist`.
- **Job `deploy`:** `needs: build`, סביבה `github-pages`, `actions/deploy-pages`. כך Build או בדיקה שנכשלים לא מגיעים לפריסה.
- גרסאות ה-Actions ייבדקו מול התיעוד העדכני בזמן הכתיבה.

## 4. בדיקה מקומית לפני הדחיפה (בעצמי)
1. `npm ci`, `npm run typecheck`, `npm run test`, `npm run build` — כולם עוברים, בדיוק כמו ב-CI.
2. אימות תחביר ה-YAML של ה-Workflow.
3. `npm run preview` ובדיקה ש-`/simon/` טוען, שה-Manifest וה-Service Worker תחת `/simon/` ושאין 404 בנכסים.

## 5. צעדים שאתה (המשתמש) עושה — אדריך צעד אחר צעד
1. **ה-Repo ציבורי:** GitHub → `simon` → Settings → General → Danger Zone → Change visibility → Public. (נבדוק יחד לפני הכול; בחשבון Free Pages דורש Repo ציבורי.)
2. **הפעלת Pages:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. **דחיפה:** אחרי שתבקש "דחוף שינויים לגיטהאב" — ה-Workflow ירוץ. אם ה-push של קובץ ה-Workflow נדחה בגלל הרשאות (חסרה הרשאת `workflow` ב-Token) — אעצור ואדריך אותך.
4. **מעקב:** לשונית Actions ב-GitHub — מחכים לסימון ירוק (✓), ואז פותחים `https://haiyael8.github.io/simon/`.

> לפי ה-CLAUDE.md אני לא עושה push ולא מחבר חשבונות בעצמי; הפריסה מתבצעת רק בדרך הזו.

## 6. בדיקה בטלפון אמיתי (הוראות פשוטות שאכתוב אחרי הבנייה)
פתיחת הכתובת בטלפון ← משחק מלא (שלבים, צלילים — כולל מצב שקט, כישלון בשלב 1, ניצחון + קונפטי) ← מעבר ל"אודות" והמשך משחק ← נעילת מסך וחזרה ← היסטוריה (עד 10, מחיקה מאושרת) ← התקנה למסך הראשי (אנדרואיד: "התקן אפליקציה"; iOS: שיתוף ← "הוסף למסך הבית") ← פתיחה במצב טיסה. כל בדיקה שלא בוצעה (למשל iOS בלי מכשיר) תדווח כ"לא נבדקה".

## 7. מה לא נעשה
אין דומיין מותאם, אין אנליטיקס, אין פיצ'רים חדשים, אין שינוי ב-PRD/DESIGN.

## 8. משימות
- בדיקה שה-Repo ציבורי והדרכה אם לא
- כתיבת Workflow שבודק, בונה ומפרסם
- הרצה מקומית של אותן בדיקות כמו ב-CI
- הדרכה להפעלת Pages ולדחיפה
- אימות שהאתר חי ב-HTTPS תחת `/simon/`
- הוראות בדיקה בטלפון ודיווח על מה שלא נבדק
