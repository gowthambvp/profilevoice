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

## Backlog
- P0: Phase 2 (awaiting user approval)
- P1: Approvals, Schedule queue, Content Studio, Ad Studio real screens
- P2: Backend API integration, real auth
