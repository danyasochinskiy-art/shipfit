ShipFit v1.1.0 Supabase Prep Release Candidate

Purpose:
- Prepare optional Supabase Magic Link backup/sync for a separate ShipFit project.
- Keep localStorage as the primary persistence layer.
- Keep the app usable in local/PWA mode when Supabase is not configured.
- Harden the RC after static review.

Files:
- index.html
- css/styles.css
- js/app.js
- manifest.webmanifest
- sw.js
- assets/icons/
- supabase_schema.sql
- SUPABASE_SETUP_v1.1.0.md
- PATCH_REPORT_v1.1.0_SUPABASE_PREP.md
- NODE_RUNTIME_SMOKE_v1.1.0.js
- NODE_RUNTIME_SMOKE_v1.1.0_output.json

Status:
- Release Candidate: YES
- Ready for test deploy: YES, after this RC-fix package is used
- Final verified release: NO
- Supabase configured: NO
- Supabase live tested: NO
- Mobile smoke tested: NO
- Browser smoke fully verified: NO

RC-fix notes:
- Progress history now escapes imported/local weight and strength values before rendering.
- Weight input is normalized to a finite positive number before saving.
- In-app labels now identify this package as v1.1.0 Supabase Prep RC.
- Supabase remains optional and must use a separate ShipFit Supabase project, never CropMarine production.

Important:
- Use this package for test upload only.
- Complete DEPLOY_TEST_CHECKLIST.md after upload.
- Before first Supabase pull, export a local JSON backup.
- If bugs are found, next build is v1.1.1 bugfix.
