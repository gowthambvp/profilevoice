# Phase 4 flows: Asset Library + Approvals. Requires helpers.py exec'd first. Run each flow in a fresh page.goto session.
R = {}

def ok(name, cond, extra=""):
    R[name] = bool(cond)
    print(("PASS " if cond else "FAIL ") + name + (" " + str(extra) if extra else ""))


async def chip_text(page, key):
    return await txt(page, f'[data-testid="library-screen"] [data-testid="library-filter-{key}"]')


async def cards(page):
    return await page.locator('[data-testid="library-screen"] [data-testid^="asset-card-"]').evaluate_all(
        "els => els.filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid').replace('asset-card-',''))")


# Library: entry, filters, search, favorites, empty, add sheet
async def library_flow(page):
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-library"]', 1200)
    ok("library_open_from_more", await vis(page, '[data-testid="library-screen"]'))
    ids = await cards(page)
    ok("library_seed_cards", all(x in ids for x in ["lib1", "lib2", "lib3"]), ids)
    for k in ["all", "image", "video", "doc", "post", "fav"]:
        print("chip", k, await chip_text(page, k))
    await cv(page, '[data-testid="library-screen"] [data-testid="library-filter-video"]', 600)
    v = await cards(page)
    ok("filter_video", "lib3" in v and "lib1" not in v, v)
    await cv(page, '[data-testid="library-screen"] [data-testid="library-filter-doc"]', 600)
    d = await cards(page)
    ok("filter_doc", "lib1" in d and "lib2" not in d, d)
    await cv(page, '[data-testid="library-screen"] [data-testid="library-filter-fav"]', 600)
    f0 = await cards(page)
    print("fav initially", f0, "empty visible", await vis(page, '[data-testid="library-empty"]'))
    await cv(page, '[data-testid="library-screen"] [data-testid="library-filter-all"]', 600)
    await cv(page, '[data-testid="library-screen"] [data-testid="asset-fav-lib2"]', 700)
    ok("fav_toggle_stays_on_library", await vis(page, '[data-testid="library-screen"]') and not await vis(page, '[data-testid="asset-detail-screen"]'))
    await cv(page, '[data-testid="library-screen"] [data-testid="library-filter-fav"]', 600)
    f1 = await cards(page)
    ok("fav_filter_updates", ("lib2" in f1) != ("lib2" in f0), f1)
    print("fav chip", await chip_text(page, "fav"))
    await cv(page, '[data-testid="library-screen"] [data-testid="library-filter-all"]', 600)
    await page.locator('[data-testid="library-screen"] input[data-testid="library-search-input"], [data-testid="library-screen"] [data-testid="library-search-input"] input').first.fill("zzzqqq")
    await page.wait_for_timeout(600)
    ok("search_empty_state", await vis(page, '[data-testid="library-empty"]'))
    # search by campaign name of as1
    await page.locator('[data-testid="library-screen"] input[data-testid="library-search-input"], [data-testid="library-screen"] [data-testid="library-search-input"] input').first.fill("")
    await page.wait_for_timeout(500)
    meta = await page.locator('[data-testid="library-screen"] [data-testid="asset-card-as1"]').inner_text()
    print("as1 card", meta.replace("\n", " | "))
    camp = meta.split("\n")[-1].strip()
    await page.locator('[data-testid="library-screen"] input[data-testid="library-search-input"], [data-testid="library-screen"] [data-testid="library-search-input"] input').first.fill(camp[:8])
    await page.wait_for_timeout(600)
    s = await cards(page)
    ok("search_by_campaign", "as1" in s and "lib1" not in s, s)
    await page.locator('[data-testid="library-screen"] input[data-testid="library-search-input"], [data-testid="library-screen"] [data-testid="library-search-input"] input').first.fill("")
    await page.wait_for_timeout(400)
    await cv(page, '[data-testid="library-add-button"]', 800)
    ok("add_sheet_opens", await vis(page, '[data-testid="library-add-sheet"]'))
    ok("add_sheet_buttons", await vis(page, '[data-testid="library-add-media"]') and await vis(page, '[data-testid="library-add-doc"]'))
    try:
        async with page.expect_file_chooser(timeout=4000) as fc:
            await page.locator('[data-testid="library-add-doc"]').first.click()
        ok("add_doc_file_chooser", True)
        await (await fc.value).set_files(files=[{"name": "TEST_brief.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4 test"}])
        await page.wait_for_timeout(1500)
        ok("add_doc_opens_asset", await vis(page, '[data-testid="asset-detail-screen"]'))
        print("new asset name", await page.locator('[data-testid="asset-detail-screen"] input').first.input_value())
    except Exception as e:
        ok("add_doc_file_chooser", False, str(e)[:120])
    await page.screenshot(path="/tmp/p4_lib.jpeg", quality=40, full_page=False)


# Asset detail: fav, rename validation, campaign move reflected, source link, delete
async def asset_flow(page):
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-library"]', 1200)
    await cv(page, '[data-testid="library-screen"] [data-testid="asset-card-lib1"]', 1200)
    ok("asset_detail_open", await vis(page, '[data-testid="asset-detail-screen"]'))
    await cv(page, '[data-testid="asset-detail-fav"]', 600)
    inp = page.locator('[data-testid="asset-detail-screen"] input[data-testid="asset-name-input"], [data-testid="asset-detail-screen"] [data-testid="asset-name-input"] input, [data-testid="asset-detail-screen"] textarea').first
    await inp.fill("")
    await page.wait_for_timeout(300)
    await cv(page, '[data-testid="asset-rename-button"]', 500)
    ok("rename_empty_error", await vis(page, '[data-testid="asset-name-input-error"]'), await txt(page, '[data-testid="asset-name-input-error"]'))
    await inp.fill("TEST_Renamed Brief")
    await page.wait_for_timeout(300)
    await cv(page, '[data-testid="asset-rename-button"]', 600)
    ok("rename_saved", not await vis(page, '[data-testid="asset-rename-button"]'))
    await cv(page, '[data-testid="asset-campaign-c1"]', 800)
    ok("asset_linked_c1", "Not linked" not in (await txt(page, '[data-testid="asset-campaign"]') or "Not linked"), await txt(page, '[data-testid="asset-campaign"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    ok("library_fav_reflects", "lib1" in await cards(page) and (await page.locator('[data-testid="library-screen"] [data-testid="asset-fav-lib1"]').get_attribute("aria-label") or "").startswith("Remove"))
    ok("library_name_reflects", "TEST_Renamed" in (await page.locator('[data-testid="library-screen"] [data-testid="asset-card-lib1"]').inner_text()))
    await tab(page, "campaigns")
    await cv(page, '[data-testid="campaigns-screen"] [data-testid="campaign-row-c1"]', 1200)
    la = await txt(page, '[data-testid="campaign-assets-list"]')
    ok("campaign_shows_linked_asset", la and "TEST_Renamed" in la, (la or "")[:200])
    # unlink via library
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-library"]', 1200)
    await cv(page, '[data-testid="library-screen"] [data-testid="asset-card-lib1"]', 1200)
    await cv(page, '[data-testid="asset-campaign-none"]', 800)
    ok("asset_unlinked", await txt(page, '[data-testid="asset-campaign"]') == "Not linked")
    await tab(page, "campaigns")
    await cv(page, '[data-testid="campaigns-screen"] [data-testid="campaign-row-c1"]', 1200)
    la = await txt(page, '[data-testid="campaign-assets-list"]') or ""
    ok("campaign_unlink_reflects", "TEST_Renamed" not in la)
    # source link + delete on a campaign asset
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-library"]', 1200)
    found = None
    for aid in await cards(page):
        await cv(page, f'[data-testid="library-screen"] [data-testid="asset-card-{aid}"]', 900)
        if await vis(page, '[data-testid="asset-source-link"]'):
            found = aid
            break
        await cv(page, '[data-testid="header-back-button"]', 700)
    ok("asset_source_link_exists", found, found)
    if found:
        await cv(page, '[data-testid="asset-source-link"]', 1200)
        ok("source_link_navigates", await vis(page, '[data-testid="task-detail-screen"]') or await vis(page, '[data-testid="studio-editor-screen"]') or await vis(page, '[data-testid="task-title"]'))
        await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="asset-delete-button"]', 700)
    ok("delete_dialog", await vis(page, '[data-testid="delete-asset-dialog"]') or await vis(page, '[data-testid="delete-asset-dialog-confirm"]'))
    await cv(page, '[data-testid="delete-asset-dialog-confirm"]', 1200)
    ok("asset_deleted", found not in await cards(page) and await vis(page, '[data-testid="library-screen"]'), found)


async def queue_ids(page, q):
    await cv(page, f'[data-testid="approvals-screen"] [data-testid="approvals-queue-{q}"]', 600)
    return await page.locator(f'[data-testid="approvals-screen"] [data-testid="approvals-list-{q}"] [data-testid^="approval-item-"]').evaluate_all(
        "els => els.map(e => e.getAttribute('data-testid').replace('approval-item-',''))")


async def note_fill(page, text):
    loc = page.locator('[data-testid="review-screen"] textarea[data-testid="review-note-input"], [data-testid="review-screen"] input[data-testid="review-note-input"], [data-testid="review-screen"] [data-testid="review-note-input"] textarea')
    for i in range(await loc.count()):
        if await loc.nth(i).is_visible():
            await loc.nth(i).fill(text)
            break
    await page.wait_for_timeout(250)


async def counts(page):
    out = {}
    for q in ["pending", "approved", "rejected"]:
        out[q] = await txt(page, f'[data-testid="approvals-screen"] [data-testid="approvals-queue-{q}"]')
    return out


# Manager approvals: seed queues, reject validation, reject -> rejected + task feedback, approve -> asset + count drop
async def approvals_manager_flow(page):
    home_count = await txt(page, '[data-testid="summary-count-approvals"]')
    print("home approvals count", home_count)
    await cv(page, '[data-testid="summary-card-approvals"]', 1200)
    ok("approvals_open_from_home", await vis(page, '[data-testid="approvals-screen"]'))
    print("counts", await counts(page))
    p, a, r = await queue_ids(page, "pending"), await queue_ids(page, "approved"), await queue_ids(page, "rejected")
    ok("seed_pending", sorted(p) == sorted(["t1", "t7", "t21"]), p)
    ok("seed_approved", "t10" in a and "d3" in a, a)
    ok("seed_rejected", r == ["t8"], r)
    rej_txt = await txt(page, '[data-testid="approvals-list-rejected"]')
    print("rejected row:", (rej_txt or "").replace("\n", " | ")[:200])
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t8"]', 1200)
    ok("review_t8_history_rejected", await vis(page, '[data-testid="review-history-rejected"]'), (await txt(page, '[data-testid="review-history"]') or "").replace("\n", " | ")[:200])
    ok("review_t8_readonly", await vis(page, '[data-testid="review-readonly-note"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    # reject validation on t1
    await queue_ids(page, "pending")
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t1"]', 1200)
    ok("decision_card", await vis(page, '[data-testid="review-decision-card"]'))
    await cv(page, '[data-testid="review-reject-button"]', 500)
    ok("reject_empty_error", await vis(page, '[data-testid="review-note-input-error"]'), await txt(page, '[data-testid="review-note-input-error"]'))
    await note_fill(page, "too short")
    await cv(page, '[data-testid="review-reject-button"]', 500)
    ok("reject_short_error", await vis(page, '[data-testid="review-note-input-error"]') and await vis(page, '[data-testid="review-screen"]'))
    ok("status_unchanged", "In review" in (await txt(page, '[data-testid="review-status"]') or ""))
    await note_fill(page, "TEST_ Please tighten the hook and fix CTA")
    await cv(page, '[data-testid="review-reject-button"]', 1200)
    ok("reject_back_to_approvals", await vis(page, '[data-testid="approvals-screen"]'))
    r2 = await queue_ids(page, "rejected")
    ok("t1_in_rejected", "t1" in r2, r2)
    print("counts after reject", await counts(page))
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t1"]', 1200)
    await cv(page, '[data-testid="review-open-item"]', 1200)
    ok("task_status_changes_req", "Changes requested" in (await txt(page, '[data-testid="task-status"]') or ""), await txt(page, '[data-testid="task-status"]'))
    ok("task_feedback_note", "TEST_ Please tighten" in (await txt(page, '[data-testid="task-feedback"]') or ""))
    await cv(page, '[data-testid="task-review-history-button"]', 1200)
    ok("task_history_button", await vis(page, '[data-testid="review-screen"]') and await vis(page, '[data-testid="review-history-rejected"]'))
    await cv(page, '[data-testid="header-back-button"]', 800)
    await cv(page, '[data-testid="header-back-button"]', 800)
    await cv(page, '[data-testid="header-back-button"]', 800)
    # approve t7 with note; check campaign assets
    await queue_ids(page, "pending")
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t7"]', 1200)
    await note_fill(page, "TEST_ great work")
    await cv(page, '[data-testid="review-approve-button"]', 1200)
    a2 = await queue_ids(page, "approved")
    ok("t7_in_approved", "t7" in a2, a2)
    at = await txt(page, '[data-testid="approvals-list-approved"]') or ""
    ok("approved_note_shown", "TEST_ great work" in at)
    await cv(page, '[data-testid="header-back-button"]', 900)
    hc = await txt(page, '[data-testid="summary-count-approvals"]')
    ok("home_count_dropped", hc and home_count and int(hc) == int(home_count) - 2, f"{home_count}->{hc}")
    await tab(page, "campaigns")
    await cv(page, '[data-testid="campaigns-screen"] [data-testid="campaign-row-c3"]', 1200)
    la = await txt(page, '[data-testid="campaign-assets-list"]') or ""
    print("c3 assets:", la.replace("\n", " | ")[:300])
    # task-action-changes opens review screen (t21)
    await tab(page, "tasks")
    await cv(page, '[data-testid="tasks-screen"] [data-testid="task-row-t21"]', 1200)
    await cv(page, '[data-testid="task-action-changes"]', 1200)
    ok("task_action_changes_opens_review", await vis(page, '[data-testid="review-screen"]') and await vis(page, '[data-testid="review-decision-card"]'))
    await cv(page, '[data-testid="review-reject-button"]', 500)
    ok("task_changes_needs_feedback", await vis(page, '[data-testid="review-note-input-error"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    ok("t21_still_in_review", "In review" in (await txt(page, '[data-testid="task-status"]') or ""), await txt(page, '[data-testid="task-status"]'))
    await page.screenshot(path="/tmp/p4_appr.jpeg", quality=40, full_page=False)


async def open_approvals(page):
    await tab(page, "more")
    for k in ["approvals", "submissions"]:
        if await vis(page, f'[data-testid="more-module-{k}"]'):
            await cv(page, f'[data-testid="more-module-{k}"]', 1200)
            return k
    return None


# Creator: own items only, read-only review, resubmit rejected task; draft reject via draft-action-changes + resubmit; Publisher rules
async def roles_flow(page):
    await enter(page, "editor")
    # creator submits a new unlinked draft
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="studio-new-post"]', 1200)
    await cv(page, '[data-testid="editor-campaign-c1"]', 400)
    await cv(page, '[data-testid="editor-generate-button"]', 600)
    await cv(page, '[data-testid="editor-save-button"]', 600)
    await cv(page, '[data-testid="draft-action-submit"]', 800)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    mod = await open_approvals(page)
    ok("creator_approvals_module", mod and await vis(page, '[data-testid="approvals-screen"]'), mod)
    p = await queue_ids(page, "pending")
    lst = await txt(page, '[data-testid="approvals-list-pending"]') or ""
    print("creator pending", p)
    new_d = [x for x in p if x.startswith("d")]
    ok("creator_sees_new_draft", len(new_d) == 1, new_d)
    r = await queue_ids(page, "rejected")
    a = await queue_ids(page, "approved")
    print("creator approved", a, "rejected", r)
    ok("creator_only_own", "t21" not in p or "Dev R." in lst)
    await queue_ids(page, "rejected")
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t8"]', 1200)
    ok("creator_no_decision_card", not await vis(page, '[data-testid="review-decision-card"]') and await vis(page, '[data-testid="review-readonly-note"]'))
    await cv(page, '[data-testid="review-open-item"]', 1200)
    await cv(page, '[data-testid="task-action-resubmit"]', 1000)
    ok("creator_resubmit_status", "In review" in (await txt(page, '[data-testid="task-status"]') or ""), await txt(page, '[data-testid="task-status"]'))
    await cv(page, '[data-testid="header-back-button"]', 800)
    await cv(page, '[data-testid="header-back-button"]', 800)
    p2 = await queue_ids(page, "pending")
    ok("t8_back_in_pending", "t8" in p2, p2)
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t8"]', 1200)
    sub = await page.locator('[data-testid="review-screen"] [data-testid="review-history-submitted"]:visible').count()
    first = await page.locator('[data-testid="review-screen"] [data-testid^="review-history-"]:visible').evaluate_all("els=>els.map(e=>e.getAttribute('data-testid'))")
    ok("t8_new_submitted_entry", sub >= 2 and first[0] == "review-history-submitted", first)
    await cv(page, '[data-testid="header-back-button"]', 800)
    # manager rejects draft via draft-action-changes
    await switch_role(page, "super_admin")
    await open_approvals(page)
    if new_d:
        did = new_d[0]
        await queue_ids(page, "pending")
        await cv(page, f'[data-testid="approvals-screen"] [data-testid="approval-item-{did}"]', 1200)
        await cv(page, '[data-testid="review-open-item"]', 1500)
        ok("draft_editor_open", await vis(page, '[data-testid="studio-editor-screen"]'))
        await cv(page, '[data-testid="draft-action-changes"]', 1200)
        ok("draft_changes_opens_review", await vis(page, '[data-testid="review-screen"]') and await vis(page, '[data-testid="review-decision-card"]'))
        await cv(page, '[data-testid="review-reject-button"]', 500)
        ok("draft_reject_needs_feedback", await vis(page, '[data-testid="review-note-input-error"]'))
        await note_fill(page, "TEST_ Draft needs a stronger opening line")
        await cv(page, '[data-testid="review-reject-button"]', 1200)
        print("after draft reject visible: editor", await vis(page, '[data-testid="studio-editor-screen"]'), "status", await txt(page, '[data-testid="editor-status"]'))
        await cv(page, '[data-testid="editor-close-button"]', 900)
        await switch_role(page, "editor")
        await open_approvals(page)
        rr = await queue_ids(page, "rejected")
        ok("draft_in_rejected", did in rr, rr)
        await cv(page, f'[data-testid="approvals-screen"] [data-testid="approval-item-{did}"]', 1200)
        await cv(page, '[data-testid="review-open-item"]', 1500)
        await cv(page, '[data-testid="draft-action-submit"]', 1000)
        print("draft status after resubmit", await txt(page, '[data-testid="editor-status"]'))
        await cv(page, '[data-testid="editor-close-button"]', 900)
        if not await vis(page, '[data-testid="approvals-screen"]'):
            await open_approvals(page)
        pp = await queue_ids(page, "pending")
        ok("draft_back_in_pending", did in pp, pp)
    # publisher
    await switch_role(page, "publisher")
    await tab(page, "home")
    await cv(page, '[data-testid="quick-action-library"]', 1200)
    ok("publisher_library", await vis(page, '[data-testid="library-screen"]'))
    await cv(page, '[data-testid="library-screen"] [data-testid="asset-card-as1"]', 1200)
    ok("publisher_readonly_asset", await vis(page, '[data-testid="asset-readonly-note"]'))
    await cv(page, '[data-testid="header-back-button"]', 800)
    await cv(page, '[data-testid="header-back-button"]', 800)
    await open_approvals(page)
    allq = (await queue_ids(page, "pending")) + (await queue_ids(page, "approved")) + (await queue_ids(page, "rejected"))
    ok("publisher_no_drafts", not any(x.startswith("d") for x in allq), allq)
    await queue_ids(page, "pending")
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t21"]', 1200)
    ok("publisher_can_review_task", await vis(page, '[data-testid="review-decision-card"]'))
    await page.screenshot(path="/tmp/p4_roles.jpeg", quality=40, full_page=False)


# Regression + edge: linked draft d1 submitted -> pending t9 (task row) with history; delete t9 -> d1 unlinked in pending, history check; creator readonly asset
async def regression_edge_flow(page):
    await studio_flow(page)  # from studio_flows.py (ends as super_admin)
    ok("studio_flow", True)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "editor")
    await tab(page, "home")
    await cv(page, '[data-testid="quick-action-library"]', 1200)
    if await vis(page, '[data-testid="library-screen"]'):
        await cv(page, '[data-testid="library-screen"] [data-testid="asset-card-as5"]', 1200)
        ok("creator_readonly_other_asset", await vis(page, '[data-testid="asset-readonly-note"]'))
        await cv(page, '[data-testid="header-back-button"]', 800)
        await cv(page, '[data-testid="library-screen"] [data-testid="asset-card-as1"]', 1200)
        ok("creator_can_edit_own_asset", await vis(page, '[data-testid="asset-delete-button"]'))
        await cv(page, '[data-testid="header-back-button"]', 800)
    else:
        print("creator has no library quick action")
        await open_approvals(page)


async def linked_delete_flow(page):
    await enter(page, "editor")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-submit"]', 700)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "super_admin")
    await open_approvals(page)
    p = await queue_ids(page, "pending")
    ok("linked_draft_as_task_row", "t9" in p and "d1" not in p, p)
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-t9"]', 1200)
    print("t9 review history:", await page.locator('[data-testid="review-screen"] [data-testid^="review-history-"]:visible').count())
    await tab(page, "tasks")
    await cv(page, '[data-testid="tasks-screen"] [data-testid="task-row-t9"]', 1200)
    await cv(page, '[data-testid="task-delete-button"]', 600)
    await cv(page, '[data-testid="delete-task-dialog-confirm"]', 1200)
    await open_approvals(page)
    p = await queue_ids(page, "pending")
    ok("d1_pending_after_task_delete", "d1" in p, p)
    print("d1 row:", (await txt(page, '[data-testid="approvals-screen"] [data-testid="approval-item-d1"]') or "").replace("\n", " | "))
    await cv(page, '[data-testid="approvals-screen"] [data-testid="approval-item-d1"]', 1200)
    hc = await page.locator('[data-testid="review-screen"] [data-testid^="review-history-"]:visible').count()
    ok("d1_history_kept_after_task_delete", hc >= 1, hc)
    await page.screenshot(path="/tmp/p4_reg.jpeg", quality=40, full_page=False)
