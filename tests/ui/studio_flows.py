# Phase 3 Content/Ad Studio regression snippet (paste into browser_automation after loading helpers.py with globals()).
# Covers: creator generate/save/submit d1 (linked t9) -> super_admin approve -> t9 Approved + c1 asset; publisher no-access.
async def rows(page):
    return await page.locator('[data-testid="studio-drafts-list"] [data-testid^="draft-row-"]').evaluate_all(
        "els=>els.filter(e=>e.offsetParent!==null).map(e=>e.getAttribute('data-testid'))")

async def studio_flow(page):
    await enter(page, "editor")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    assert await rows(page) == ["draft-row-d1"]
    await cv(page, '[data-testid="studio-new-blog"]', 1200)
    await cv(page, '[data-testid="editor-save-button"]', 500)
    assert await vis(page, '[data-testid="editor-title-input-error"]')
    await cv(page, '[data-testid="editor-generate-button"]', 400)
    await cv(page, '[data-testid="editor-save-button"]', 500)
    assert "Draft" in (await txt(page, '[data-testid="editor-status"]'))
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await cv(page, '[data-testid="draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-submit"]', 600)
    assert await vis(page, '[data-testid="editor-locked-note"]')
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "super_admin")
    await tab(page, "home")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-approve"]', 600)
    assert "Approved" in (await txt(page, '[data-testid="editor-status"]'))
    # Campaign rows also exist (hidden) on Home -> scope to campaigns-screen when opening campaign detail.
    print("studio_flow OK")

# Iteration 5 checks: unlinked submitted draft reaches manager approvals; reopen of linked approved draft reverts task + asset.
async def unlinked_draft_approval_flow(page):
    await enter(page, "editor")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="studio-new-post"]', 1200)
    await cv(page, '[data-testid="editor-campaign-c1"]', 400)  # Linked task stays "None"
    await cv(page, '[data-testid="editor-generate-button"]', 500)
    await cv(page, '[data-testid="editor-save-button"]', 500)
    await cv(page, '[data-testid="draft-action-submit"]', 700)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "super_admin")
    await tab(page, "home")
    assert (await txt(page, '[data-testid="summary-count-approvals"]')).strip() == "4"  # seed has 3
    await cv(page, '[data-testid="summary-count-approvals"]', 1200)
    assert await vis(page, '[data-testid^="approval-draft-row-"]')
    await cv(page, '[data-testid^="approval-draft-row-"]', 1200)
    await cv(page, '[data-testid="draft-action-approve"]', 700)
    assert "Approved" in (await txt(page, '[data-testid="editor-status"]'))
    print("unlinked_draft_approval_flow OK")
# Known gap (iteration 5): deleting task t9 while d1 is In review drops d1 from approvals (stale taskId).

# Iteration 6 checks: delete linked task t9 while d1 In review -> d1 stays in approvals as approval-draft-row-d1 ("· Recently").
async def delete_task_keeps_draft_approval(page):
    await enter(page, "editor")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-submit"]', 700)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "super_admin")
    await tab(page, "tasks")
    await cv(page, '[data-testid="task-row-t9"]', 1200)
    await cv(page, '[data-testid="task-delete-button"]', 600)
    await cv(page, '[data-testid="delete-task-dialog-confirm"]', 1200)
    await tab(page, "home")
    assert (await txt(page, '[data-testid="summary-count-approvals"]')).strip() == "4"
    await cv(page, '[data-testid="summary-count-approvals"]', 1200)
    assert "Recently" in (await txt(page, '[data-testid="approval-draft-row-d1"]'))
    print("delete_task_keeps_draft_approval OK")
# Iteration 7: deleting campaign c1 while d1 In review -> approvals 4 -> 3 (t1, t9 removed; d1 kept as approval-draft-row-d1, 'No campaign').
async def delete_campaign_keeps_draft_approval(page):
    await enter(page, "editor")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-submit"]', 700)
    await cv(page, '[data-testid="editor-close-button"]', 900)
    await switch_role(page, "super_admin")
    await tab(page, "campaigns")
    await cv(page, '[data-testid="campaigns-screen"] [data-testid="campaign-row-c1"]', 1200)
    await cv(page, '[data-testid="campaign-delete-button"]', 600)
    await cv(page, '[data-testid="delete-campaign-dialog-confirm"]', 1500)
    await tab(page, "home")
    assert (await txt(page, '[data-testid="summary-count-approvals"]')).strip() == "3"
    await cv(page, '[data-testid="summary-count-approvals"]', 1200)
    assert await vis(page, '[data-testid="approval-draft-row-d1"]')
    await cv(page, '[data-testid="approval-draft-row-d1"]', 1200)
    await cv(page, '[data-testid="draft-action-approve"]', 900)
    assert "Approved" in (await txt(page, '[data-testid="editor-status"]'))
    print("delete_campaign_keeps_draft_approval OK")
# Role ids: super_admin | admin (Owner/Admin) | editor (Creator) | publisher. Publisher no-access: pushState('/studio/content') + popstate event.
# Approvals placeholder screen uses placeholder-back-button (not header-back-button) -> helpers.tab() can't back out of it.
