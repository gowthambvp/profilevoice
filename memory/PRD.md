# ProfileVoice Mobile — PRD

## Original problem
Phased Expo (React Native + TypeScript) iOS-first app for ProfileVoice. Frontend only, local mock data, no backend/auth/payments/AI. Source of truth: "ProfileVoice-Role-based-workspace-FINAL-v79_1 1.html". Implement one phase at a time and wait for approval.
User choices: roles/terminology taken from the attached HTML; do NOT remember role (always start at splash); "best user friendly designs"; later: decrease font and icon sizes.

## Architecture (Phase 1)
- expo-router: `app/index.tsx` (splash), `app/(tabs)/{home,tasks,create,campaigns,more}.tsx`, `app/create-menu.tsx` + `app/role-switcher.tsx` (transparent modal sheets), `app/module/[key].tsx` (placeholders with Back)
- `src/config/roles.ts` central role config (labels, nav, quick/create actions, dashboard cards, permissions); `src/config/modules.ts` destinations
- `src/data/mock.ts` demo data (from HTML), `src/services/dashboard.ts` derived selectors, `src/state/DemoContext.tsx` in-memory role + toast
- `src/theme.ts` brand tokens; components in `src/components`
- iOS 26+ NativeTabs, otherwise JS Tabs with raised Create button

## Implemented (Oct 2026)
- Phase 1 complete: splash + Demo Mode, 4-role switcher, role-aware dashboard, tabs, Create menu, More modules, placeholders, task/campaign lists with filters, empty states
- Fixed exit-demo / reload loop (Home tab moved to /home); guarded modal routes
- Reduced font scale and icon sizes app-wide

- Phase 2 complete (Oct 2026): central DataStore (src/state/DataStore.tsx) with campaign/task CRUD, workflow status actions per role (taskActions in roles.ts), due-date changes, assets from approved work, activity log; campaign list/detail/edit, task list (My/Team/All, search, filters, sort, due grouping, priority)/detail/edit; reset demo data; testing iterations 2-3 passed

- Phase 3 complete (Oct 2026): Content Studio + Ad Studio (/studio/[kind], /studio/editor) — format, campaign + linked task, brand voice, tone, length/channel/platform/ratio/duration, local template generator (src/services/generator.ts), editable output, preview (article/post/image & video ad), copy to clipboard (expo-clipboard), save/edit/delete drafts, discard guard, role-aware approval synced with linked tasks and campaign assets, task -> studio cross-link; Publishers have no studio access; testing iterations 4-7 passed

- Phase 4 complete (Oct 2026): Asset Library (/library) with image/video/document/post/favorites filters, search, local media + document picking (expo-image-picker, expo-document-picker; files stay on device), asset detail (/asset/[id]) rename, favorite, campaign link/unlink, source link, delete; Approvals (/approvals) Pending/Approved/Rejected queues for tasks + unlinked drafts; Review screen (/review) approve (optional note) / reject (feedback >= 10 chars required) with review history; feedback shown on task detail; testing iterations 8-9 passed (87/87)

- Phase 5 (Publishing, Branding, Team): /publish calendar (month grid with status dots) + list (Upcoming/Paused/Failed/Published/All), /publish/[id] post detail with demo Publish now (Publishing → Published), pause/resume, retry, simulate failure, reschedule, cancel; /publish/edit schedule/reschedule form (date, 15-min time stepper + slots, channels, campaign, asset, clash + past-date validation); publishing a post completes its linked task and vice-versa; task detail "Schedule the post" for Library tasks. /branding brand kit, voices (add/edit/delete via /branding/voice), preferences (name, tagline, default voice/tone → new studio drafts, words to avoid + hashtags applied by generator); Creators view-only, Publishers no access. /team list (search, role filters, workload), /team/invite (Owner/Admin can't invite Owner/Admins), /team/[id] profile (assign task → /task/edit?assignee=, role change for non-persona members, title, accept/resend invite, deactivate/reactivate, remove → open tasks reassigned to remover). Team/voices/brand live in DataStore and sync into PEOPLE/VOICES/BRAND lookups.

## Backlog
- P0: Phase 6 (awaiting user approval)
- P1: Approvals, Schedule queue, Content Studio, Ad Studio real screens
- P2: Backend API integration, real auth
