# Iteration 9 retest flows (Phase 4 fixes). Requires helpers.py, studio_flows.py, phase4_flows.py exec'd first.

async def hist_texts(page):
    return await page.locator('[data-testid="review-screen"] [data-testid^="review-history-"]:visible').evaluate_all(
        "els => els.map(e => e.getAttribute('data-testid') + ' :: ' + e.innerText.replace(/\\n/g,' | '))")


async def submit_d1_as_creator(page):
    await enter(page, "editor")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-submit"]', 700)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "super_admin")


async def check_d1_history(page, prefix):
    await open_approvals(page)
    p = await queue_ids(page, "pending")
    ok(prefix + "_d1_pending", "d1" in p, p)
    row = (await txt(page, '[data-testid="approvals-screen"] [data-testid="approval-item-d1"]') or "").replace("\n", " | ")
    ok(prefix + "_d1_row_time_not_recently", row and "Recently" not in row, row)
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-d1"]', 1200)
    h = await hist_texts(page)
    ok(prefix + "_d1_history_has_submitted", any("ubmit" in x for x in h), h)
    print(prefix, "url", page.url)


# FIX 1: delete linked task keeps history on draft
async def task_delete_history_flow(page):
    await submit_d1_as_creator(page)
    await tab(page, "tasks")
    await cv(page, '[data-testid="tasks-screen"] [data-testid="task-row-t9"]', 1200)
    await cv(page, '[data-testid="task-delete-button"]', 600)
    await cv(page, '[data-testid="delete-task-dialog-confirm"]', 1200)
    await check_d1_history(page, "taskdel")
    # direct URL check via in-app history (no reload)
    await page.evaluate("() => { window.history.pushState({}, '', '/review?kind=draft&id=d1'); window.dispatchEvent(new PopStateEvent('popstate')); }")
    await page.wait_for_timeout(1500)
    h = await hist_texts(page)
    ok("taskdel_direct_review_url_history", any("ubmit" in x for x in h), h)
    await page.screenshot(path="/tmp/p9_taskdel.jpeg", quality=40, full_page=False)


# FIX 2: delete campaign moves linked tasks' history to drafts
async def campaign_delete_history_flow(page):
    await submit_d1_as_creator(page)
    await tab(page, "campaigns")
    await cv(page, '[data-testid="campaigns-screen"] [data-testid="campaign-row-c1"]', 1200)
    await cv(page, '[data-testid="campaign-delete-button"]', 600)
    await cv(page, '[data-testid="delete-campaign-dialog-confirm"]', 1500)
    await check_d1_history(page, "campdel")
    # approve d1 from review to confirm flow still works after move
    if await vis(page, '[data-testid="review-approve-button"]'):
        await cv(page, '[data-testid="review-approve-button"]', 1200)
        h = await hist_texts(page)
        print("campdel history after approve", h)
    await page.screenshot(path="/tmp/p9_campdel.jpeg", quality=40, full_page=False)


# FIX 3/4: add sheet closes then picker; fav 44x44 toggles
async def library_fix_flow(page):
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-library"]', 1200)
    fav = page.locator('[data-testid="library-screen"] [data-testid="asset-fav-lib2"]').first
    bb = await fav.bounding_box()
    ok("fav_44x44", bb and bb["width"] >= 44 and bb["height"] >= 44, bb)
    lbl0 = await fav.get_attribute("aria-label")
    await fav.click()
    await page.wait_for_timeout(600)
    lbl1 = await fav.get_attribute("aria-label")
    ok("fav_toggles", lbl0 != lbl1 and not await vis(page, '[data-testid="asset-detail-screen"]'), f"{lbl0} -> {lbl1}")
    # edge tap of the 44pt circular target (outside old 32px) still toggles, not opens card (corners are outside the circle)
    bb = await fav.bounding_box()
    await page.mouse.click(bb["x"] + 3, bb["y"] + bb["height"] / 2)
    await page.wait_for_timeout(700)
    lbl2 = await fav.get_attribute("aria-label")
    ok("fav_edge_tap_toggles", lbl2 == lbl0 and not await vis(page, '[data-testid="asset-detail-screen"]'), lbl2)
    for k, fname, mime, buf in [("doc", "TEST_brief.pdf", "application/pdf", b"%PDF-1.4 t"), ("media", "TEST_pic.png", "image/png", bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"))]:
        if not await vis(page, '[data-testid="library-screen"]'):
            await cv(page, '[data-testid="header-back-button"]', 900)
        await cv(page, '[data-testid="library-add-button"]', 800)
        ok(f"{k}_sheet_open", await vis(page, '[data-testid="library-add-sheet"]'))
        try:
            async with page.expect_file_chooser(timeout=5000) as fc:
                await page.locator(f'[data-testid="library-add-{k}"]').first.click()
            # chooser fires ~400ms after tap; the sheet's fade finishes ~290ms -> must be gone by now
            ok(f"{k}_sheet_closed_before_picker", await page.locator('[data-testid="library-add-sheet"]').count() == 0)
            ok(f"{k}_file_chooser_opens", True)
            await (await fc.value).set_files(files=[{"name": fname, "mimeType": mime, "buffer": buf}])
            await page.wait_for_timeout(1800)
            ok(f"{k}_asset_created_opens_detail", await vis(page, '[data-testid="asset-detail-screen"]'))
        except Exception as e:
            ok(f"{k}_file_chooser_opens", False, str(e)[:150])
            print("sheet still visible:", await vis(page, '[data-testid="library-add-sheet"]'))
    await page.screenshot(path="/tmp/p9_lib.jpeg", quality=40, full_page=False)


# review-open-item size
async def review_open_item_flow(page):
    await open_approvals(page)
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t1"]', 1200)
    loc = page.locator('[data-testid="review-screen"] [data-testid="review-open-item"]:visible').first
    bb = await loc.bounding_box()
    ok("review_open_item_44", bb and bb["height"] >= 44, bb)
    await loc.click()
    await page.wait_for_timeout(1200)
    ok("review_open_item_navigates", "/task/t1" in page.url, page.url)
