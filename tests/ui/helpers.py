# Shared Playwright helpers for ProfileVoice Expo web UI tests (paste into browser_automation scripts).
# Notes: data is in-memory -> never page.goto() mid-flow (reload resets data & role).
# Tabs stay mounted on web -> always act on the *visible* element (duplicate testIDs exist).
# Stack screens (campaign/task detail, forms) hide the tab bar -> tap header-back-button before tab clicks.
# Campaign form preselects Instagram channel + current user in team (clicking them toggles OFF).

async def enter(page, role):
    await page.wait_for_selector('[data-testid="enter-demo-mode-button"]', timeout=20000)
    await page.wait_for_timeout(1600)
    await page.click(f'[data-testid="splash-screen"] [data-testid="role-option-{role}"]', force=True)
    await page.click('[data-testid="enter-demo-mode-button"]', force=True)
    await page.wait_for_selector('[data-testid="home-screen"]', timeout=10000)
    await page.wait_for_timeout(800)


async def vis(page, sel):
    loc = page.locator(sel)
    for i in range(await loc.count()):
        if await loc.nth(i).is_visible():
            return True
    return False


async def txt(page, sel):
    loc = page.locator(sel)
    for i in range(await loc.count()):
        if await loc.nth(i).is_visible():
            return await loc.nth(i).inner_text()
    return None


async def cv(page, sel, wait=350):
    """Click the first visible match (scroll + small settle wait)."""
    loc = page.locator(sel)
    for i in range(await loc.count()):
        if await loc.nth(i).is_visible():
            await loc.nth(i).scroll_into_view_if_needed()
            await page.wait_for_timeout(150)
            await loc.nth(i).click()
            await page.wait_for_timeout(wait)
            return True
    print("NOT VISIBLE", sel)
    return False


async def tab(page, name):
    for _ in range(5):
        if await vis(page, f'[data-testid="tab-{name}"]'):
            break
        if not await cv(page, '[data-testid="header-back-button"]', 700):
            break
    await page.click(f'[data-testid="tab-{name}"]', force=True)
    await page.wait_for_timeout(900)


async def switch_role(page, role):
    await tab(page, "more")
    await cv(page, '[data-testid="open-role-switcher-button"]', 900)
    await cv(page, f'[data-testid="role-switcher-sheet"] [data-testid="role-option-{role}"]', 1200)


async def task_rows(page):
    return await page.locator('[data-testid="tasks-list"] [data-testid^="task-row-"]').evaluate_all(
        "els => els.map(e => e.getAttribute('data-testid').replace('task-row-',''))")
