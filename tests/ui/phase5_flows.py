# Phase 5 flows: publishing calendar/list, post detail actions, schedule form validation, task->post link.
# Requires helpers.py exec'd first. Each flow enters its own role (start from splash).
R = []


def ck(name, cond, extra=""):
    R.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f" :: {extra}" if extra else ""))


async def counts(page):
    return await page.locator('[data-testid^="summary-count-"]').evaluate_all(
        "els => els.filter(e=>e.offsetParent).map(e => e.getAttribute('data-testid').replace('summary-count-','')+'='+e.innerText)")


async def open_publish(page):
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-publish"]', 1200)


async def post_rows(page):
    return await page.locator('[data-testid="publish-screen"] [data-testid^="post-row-"]').evaluate_all(
        "els => els.filter(e=>e.offsetParent).map(e => e.getAttribute('data-testid').replace('post-row-',''))")


async def publish_flow(page):
    await enter(page, "super_admin")
    c0 = await counts(page)
    print("HOME COUNTS", c0)
    await open_publish(page)
    ck("publish screen", await vis(page, '[data-testid="publish-screen"]'))
    ck("demo note", await vis(page, '[data-testid="publish-demo-note"]'))
    ck("calendar default", await vis(page, '[data-testid="publish-calendar"]'))
    ck("cal title Sep 2026", "September 2026" in (await txt(page, '[data-testid="publish-cal-title"]') or ""))
    await cv(page, '[data-testid="publish-day-2026-09-25"]', 500)
    ck("day 25 shows s1", "s1" in await post_rows(page), await post_rows(page))
    await cv(page, '[data-testid="publish-cal-next"]', 500)
    t = await txt(page, '[data-testid="publish-cal-title"]')
    await cv(page, '[data-testid="publish-cal-prev"]', 500)
    ck("cal next/prev", "October" in (t or "") and "September" in (await txt(page, '[data-testid="publish-cal-title"]')), t)
    await cv(page, '[data-testid="publish-view-list"]', 600)
    up = await post_rows(page)
    print("UPCOMING", up)
    ck("upcoming has s1,s2", "s1" in up and "s2" in up)
    for f in ["Paused", "Failed", "Published", "all"]:
        await cv(page, f'[data-testid="publish-filter-{f}"]', 500)
        print("FILTER", f, await txt(page, f'[data-testid="publish-filter-{f}"]'), await post_rows(page))
    await cv(page, '[data-testid="publish-filter-Failed"]', 500)
    ck("failed has s4", "s4" in await post_rows(page))
    # failed post detail
    await cv(page, '[data-testid="post-row-s4"]', 1000)
    ck("failure note", await vis(page, '[data-testid="post-failure-note"]'))
    ck("retry btn", await vis(page, '[data-testid="post-retry"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    # s1 detail: links + publish now
    await cv(page, '[data-testid="publish-filter-upcoming"]', 500)
    await cv(page, '[data-testid="post-row-s1"]', 1000)
    ck("s1 status Scheduled", (await txt(page, '[data-testid="post-status"]')) == "Scheduled")
    print("S1 TASK LINK", await txt(page, '[data-testid="post-task-link"]'))
    await cv(page, '[data-testid="post-publish-now"]', 300)
    ck("Publishing state", (await txt(page, '[data-testid="post-status"]')) == "Publishing")
    await page.wait_for_timeout(1600)
    ck("Published state", (await txt(page, '[data-testid="post-status"]')) == "Published")
    tl = await txt(page, '[data-testid="post-task-link"]')
    ck("t6 Completed", "Completed" in (tl or ""), tl)
    ck("live note", await vis(page, '[data-testid="post-live-note"]'))
    ck("no edit when live", not await vis(page, '[data-testid="post-edit-button"]'))
    await cv(page, '[data-testid="post-task-link"]', 1000)
    print("TASK t6 status", await txt(page, '[data-testid="task-status"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="header-back-button"]', 900)
    # s2 pause/resume/simulate fail/retry
    await cv(page, '[data-testid="post-row-s2"]', 1000)
    await cv(page, '[data-testid="post-pause"]', 500)
    ck("paused", (await txt(page, '[data-testid="post-status"]')) == "Paused")
    await cv(page, '[data-testid="post-resume"]', 500)
    ck("resumed", (await txt(page, '[data-testid="post-status"]')) == "Scheduled")
    await cv(page, '[data-testid="post-simulate-fail"]', 500)
    ck("sim failed", (await txt(page, '[data-testid="post-status"]')) == "Failed" and await vis(page, '[data-testid="post-failure-note"]'))
    await cv(page, '[data-testid="post-retry"]', 1700)
    ck("retry published", (await txt(page, '[data-testid="post-status"]')) == "Published")
    print("S2 TASK LINK", await txt(page, '[data-testid="post-task-link"]'))
    await cv(page, '[data-testid="post-campaign-link"]', 1000)
    ck("campaign link opens", await vis(page, '[data-testid="campaign-detail-screen"]') or "campaign" in page.url, page.url)
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="header-back-button"]', 900)
    # reschedule paused s3 to new date -> Scheduled
    await cv(page, '[data-testid="publish-filter-Paused"]', 500)
    await cv(page, '[data-testid="post-row-s3"]', 1000)
    await cv(page, '[data-testid="post-reschedule"]', 1000)
    await cv(page, '[data-testid="post-date-input"]', 500)
    await cv(page, '[data-testid="post-date-input-calendar-day-2026-09-30"]', 400)
    await cv(page, '[data-testid="form-save-button"]', 1000)
    ck("s3 rescheduled -> Scheduled", (await txt(page, '[data-testid="post-status"]')) == "Scheduled", await txt(page, '[data-testid="post-when"]'))
    # cancel post s3
    await cv(page, '[data-testid="post-delete-button"]', 600)
    await cv(page, '[data-testid="delete-post-dialog-confirm"]', 1000)
    await cv(page, '[data-testid="publish-filter-all"]', 500)
    ck("s3 removed", "s3" not in await post_rows(page))
    # s4 reschedule failed -> Scheduled
    await cv(page, '[data-testid="post-row-s4"]', 1000)
    await cv(page, '[data-testid="post-edit-button"]', 1000)
    await cv(page, '[data-testid="post-date-input"]', 500)
    await cv(page, '[data-testid="post-date-input-calendar-day-2026-09-28"]', 400)
    await cv(page, '[data-testid="form-save-button"]', 1000)
    ck("s4 failed->Scheduled", (await txt(page, '[data-testid="post-status"]')) == "Scheduled")
    await cv(page, '[data-testid="header-back-button"]', 900)
    # new post form validation
    await cv(page, '[data-testid="publish-new-button"]', 1000)
    await cv(page, '[data-testid="form-save-button"]', 600)
    ck("title error", await vis(page, '[data-testid="post-title-input-error"]'))
    chans_err = await vis(page, '[data-testid="post-channels-error"]')
    ck("channels error (no default channel)", chans_err)
    await page.locator('[data-testid="post-title-input"]:visible').fill("TEST_ clash post")
    await cv(page, '[data-testid="post-channel-option-instagram"]', 300)
    await cv(page, '[data-testid="post-date-input"]', 500)
    await cv(page, '[data-testid="post-date-input-calendar-day-2026-09-20"]', 400)
    await cv(page, '[data-testid="form-save-button"]', 600)
    ck("past date error", await vis(page, '[data-testid="post-date-error"]'), await txt(page, '[data-testid="post-date-error"]'))
    # clash with s1? s1 published now -> no clash. use s2 at 26 Sep? s2 also published. use s4 now 28 Sep.
    if not await vis(page, '[data-testid="post-date-input-calendar"]'):
        await cv(page, '[data-testid="post-date-input"]', 500)
    await cv(page, '[data-testid="post-date-input-calendar-day-2026-09-28"]', 400)
    await page.wait_for_timeout(300)
    print("TIME VALUE", await txt(page, '[data-testid="post-time-input-value"]'))
    print("S4 channels/time check: saving at 28 Sep same time as s4")
    await cv(page, '[data-testid="form-save-button"]', 600)
    print("TIME ERR", await txt(page, '[data-testid="post-time-error"]'))
    await cv(page, '[data-testid="post-time-input-plus"]', 300)
    v = await txt(page, '[data-testid="post-time-input-value"]')
    await cv(page, '[data-testid="post-time-input-minus"]', 300)
    await cv(page, '[data-testid="post-time-input-slot-1800"]', 300)
    print("TIME plus ->", v, "slot ->", await txt(page, '[data-testid="post-time-input-value"]'))
    await cv(page, '[data-testid="post-campaign-option-c1"]', 300)
    await cv(page, '[data-testid="form-save-button"]', 1200)
    ck("new post detail opened", await vis(page, '[data-testid="post-detail-screen"]'), await txt(page, '[data-testid="post-when"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="publish-view-calendar"]', 500)
    await cv(page, '[data-testid="publish-day-2026-09-28"]', 500)
    print("DAY 28 rows", await post_rows(page))
    await tab(page, "home")
    print("HOME COUNTS AFTER", await counts(page))
    act = await txt(page, '[data-testid="recent-activity-card"]')
    print("ACTIVITY", (act or "")[:600])


async def visible_ids(page, prefix):
    return await page.locator(f'[data-testid^="{prefix}"]').evaluate_all(
        "els => els.filter(e=>e.offsetParent).map(e => e.getAttribute('data-testid')+'|'+e.innerText.replace(/\\n/g,' '))")


async def open_task(page, tid):
    await tab(page, "tasks")
    for f in ["all", "All"]:
        if await vis(page, f'[data-testid="tasks-filter-{f}"]'):
            await cv(page, f'[data-testid="tasks-filter-{f}"]', 500)
    if not await vis(page, f'[data-testid="task-row-{tid}"]'):
        print("TASK FILTERS", await visible_ids(page, "tasks-filter"))
    loc = page.locator(f'[data-testid="task-row-{tid}"]')
    for i in range(await loc.count() - 1, -1, -1):
        if await loc.nth(i).is_visible():
            await loc.nth(i).click(force=True)
            await page.wait_for_timeout(1000)
            if await vis(page, '[data-testid="task-detail-screen"]'):
                return True
    print("OPEN TASK FAILED", tid)
    return False


async def publisher_flow(page):
    await enter(page, "publisher")
    if SKIP_CLASH:
        return await publisher_task_part(page)
    await tab(page, "more")
    mods = await visible_ids(page, "more-module-")
    print("PUBLISHER MODULES", [m.split("|")[0] for m in mods])
    ck("publisher no team/branding", not any("team" in m.split("|")[0] or "branding" in m.split("|")[0] for m in mods))
    await cv(page, '[data-testid="more-module-publish"]', 1200)
    # clash: 25 Sep 09:00 instagram vs s1
    await cv(page, '[data-testid="publish-new-button"]', 1000)
    await page.locator('[data-testid="post-title-input"]:visible').fill("TEST_ clash")
    await cv(page, '[data-testid="post-channel-option-instagram"]', 300)
    await cv(page, '[data-testid="post-date-input"]', 500)
    await cv(page, '[data-testid="post-date-input-calendar-day-2026-09-25"]', 400)
    await cv(page, '[data-testid="post-time-input-slot-0900"]', 300)
    await cv(page, '[data-testid="form-save-button"]', 600)
    ck("clash error", await vis(page, '[data-testid="post-time-error"]'), await txt(page, '[data-testid="post-time-error"]'))
    await cv(page, '[data-testid="post-time-input-plus"]', 300)
    ck("time plus -> 9:15", "9:15" in (await txt(page, '[data-testid="post-time-input-value"]') or ""), await txt(page, '[data-testid="post-time-input-value"]'))
    await cv(page, '[data-testid="post-time-input-minus"]', 300)
    await cv(page, '[data-testid="post-time-input-minus"]', 300)
    ck("time minus -> 8:45", "8:45" in (await txt(page, '[data-testid="post-time-input-value"]') or ""))
    print("SLOTS", [s.split("|")[0] for s in await visible_ids(page, "post-time-input-slot-")])
    print("CAMPAIGN OPTS", [s.split("|")[0] for s in await visible_ids(page, "post-campaign-option-")])
    await cv(page, '[data-testid="post-campaign-option-c2"]', 300)
    print("ASSET OPTS", await visible_ids(page, "post-asset-option-"))
    await cv(page, '[data-testid^="post-asset-option-as"]', 300)
    await cv(page, '[data-testid="form-save-button"]', 1200)
    ck("publisher saved post", await vis(page, '[data-testid="post-detail-screen"]'), await txt(page, '[data-testid="post-when"]'))
    print("ASSET LINK", await txt(page, '[data-testid="post-asset-link"]'))
    await cv(page, '[data-testid="post-asset-link"]', 1000)
    print("ASSET URL", page.url)
    await publisher_task_part(page)


SKIP_CLASH = False


async def publisher_task_part(page):
    ok = await open_task(page, "t6")
    if ok:
        b = await txt(page, '[data-testid="task-schedule-post-button"]')
        ck("t6 button View scheduled post", "View scheduled post" in (b or "") and "Scheduled" in (b or ""), b)
    ok = await open_task(page, "t26")
    if ok:
        b = await txt(page, '[data-testid="task-schedule-post-button"]')
        ck("t26 button Schedule the post", b and "Schedule the post" in b, b)
        await cv(page, '[data-testid="task-schedule-post-button"]', 1000)
        tv = await page.locator('[data-testid="post-title-input"]:visible').input_value()
        print("PREFILL title", tv, "| date", await txt(page, '[data-testid="post-date-input"]'))
        await cv(page, '[data-testid="form-save-button"]', 1200)
        tl = await txt(page, '[data-testid="post-task-link"]')
        ck("t26 Ready to publish", "Ready to publish" in (tl or ""), tl)
        await cv(page, '[data-testid="header-back-button"]', 1000)
        ck("back on task detail", await vis(page, '[data-testid="task-detail-screen"]'))
        print("T26 status", await txt(page, '[data-testid="task-status"]'), "| btn", await txt(page, '[data-testid="task-schedule-post-button"]'))
        acts = await visible_ids(page, "task-action-")
        print("T26 ACTIONS", acts)
        pub = [a.split("|")[0] for a in acts if "ublish" in a or "omplete" in a]
        if pub:
            await cv(page, f'[data-testid="{pub[0]}"]', 1000)
            print("T26 after action", await txt(page, '[data-testid="task-status"]'))
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-publish"]', 1200)
    await cv(page, '[data-testid="publish-view-list"]', 500)
    await cv(page, '[data-testid="publish-filter-Published"]', 500)
    rows = await visible_ids(page, "post-row-")
    print("PUBLISHED LIST", rows)
    ck("t26 post Published", any("teaser 1" in r.lower() and "Published" in r for r in rows))
    await tab(page, "home")
    print("PUB ACTIVITY", (await txt(page, '[data-testid="recent-activity-card"]') or "")[:500])


async def fill(page, tid, val):
    await page.locator(f'[data-testid="{tid}"]:visible').fill(val)
    await page.wait_for_timeout(200)


async def selected(page, prefix):
    return await page.locator(f'[data-testid^="{prefix}"]').evaluate_all(
        "els => els.filter(e=>e.offsetParent && (e.getAttribute('aria-selected')==='true'||getComputedStyle(e).backgroundColor==='rgb(14, 46, 49)')).map(e=>e.getAttribute('data-testid'))")


async def branding_flow(page):
    await enter(page, "super_admin")
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-branding"]', 1200)
    ck("branding screen", await vis(page, '[data-testid="branding-screen"]'))
    ck("save label Saved", "Saved" in (await txt(page, '[data-testid="brand-save-button"]') or ""))
    voices = [v.split("|")[0] for v in await visible_ids(page, "brand-voice-")]
    print("VOICES", voices, "| tones", [t.split("|")[0] for t in await visible_ids(page, "brand-default-tone-")])
    print("SELECTED default voice/tone", await selected(page, "brand-default-"))
    await fill(page, "brand-name-input", "")
    ck("label Save preferences when dirty", "Save preferences" in (await txt(page, '[data-testid="brand-save-button"]') or ""))
    await cv(page, '[data-testid="brand-save-button"]', 500)
    ck("empty name error", await vis(page, '[data-testid="brand-name-input-error"]'))
    await fill(page, "brand-name-input", "TEST Herbal")
    # add voice
    await cv(page, '[data-testid="brand-add-voice"]', 1000)
    ck("voice form", await vis(page, '[data-testid="voice-form-screen"]'))
    ck("no delete on new voice", not await vis(page, '[data-testid="voice-delete-button"]'))
    await cv(page, '[data-testid="form-save-button"]', 500)
    ck("voice required errors", await vis(page, '[data-testid="voice-name-input-error"]'))
    first_voice_name = (await txt(page, '[data-testid="voice-form-screen"]')) and None
    await cv(page, '[data-testid="form-close-button"]', 900)
    vname = "Herbal Care — Core"
    await cv(page, '[data-testid="brand-add-voice"]', 1000)
    await fill(page, "voice-name-input", vname.lower())
    await fill(page, "voice-trait-input", "Calm")
    await cv(page, '[data-testid="form-save-button"]', 500)
    ck("duplicate voice name error", await vis(page, '[data-testid="voice-name-input-error"]'), f"{vname} -> {await txt(page, '[data-testid=voice-name-input-error]')}")
    await fill(page, "voice-name-input", "TEST Voice")
    await fill(page, "voice-signoff-input", "Stay calm.")
    await cv(page, '[data-testid="form-save-button"]', 1000)
    after = [v.split("|")[0] for v in await visible_ids(page, "brand-voice-")]
    new = [v for v in after if v not in voices]
    ck("voice added", len(new) == 1, after)
    print("FORM NAME after voice nav:", await page.locator('[data-testid="brand-name-input"]:visible').input_value())
    nid = new[0].replace("brand-voice-", "") if new else None
    if nid:
        await cv(page, f'[data-testid="brand-default-voice-{nid}"]', 300)
    await cv(page, '[data-testid="brand-default-tone-Playful"]', 300)
    await fill(page, "brand-name-input", "TEST Herbal")
    await fill(page, "brand-avoid-input", "made, you")
    await fill(page, "brand-hashtags-input", "#testtag, zentag")
    await cv(page, '[data-testid="brand-save-button"]', 800)
    ck("saved label after save", "Saved" in (await txt(page, '[data-testid="brand-save-button"]') or ""))
    ck("brand kit name updated", (await txt(page, '[data-testid="brand-name"]')) == "TEST Herbal")
    print("SELECTED after save", await selected(page, "brand-default-"))
    # default voice: delete button hidden; non-default voice deletable
    if nid:
        await cv(page, f'[data-testid="brand-voice-{nid}"]', 1000)
        ck("no delete for default voice", not await vis(page, '[data-testid="voice-delete-button"]'))
        await cv(page, '[data-testid="form-close-button"]', 900)
    # content studio new post
    await tab(page, "home")
    await cv(page, '[data-testid="quick-action-content"]', 1200)
    await cv(page, '[data-testid="studio-new-post"]', 1200)
    sel = await selected(page, "editor-")
    print("EDITOR SELECTED", sel)
    ck("editor default voice", nid and f"editor-voice-{nid}" in sel)
    ck("editor default tone", "editor-tone-Playful" in sel)
    await cv(page, '[data-testid="editor-generate-button"]', 800)
    body = await page.locator('[data-testid="editor-body-input"]:visible').input_value()
    print("BODY", body[:400])
    import re
    ck("hashtags added", "#testtag" in body and "#zentag" in body)
    ck("avoid words removed", not re.search(r"\b(made|you)\b", body, re.I))
    await cv(page, '[data-testid="editor-close-button"]', 700)
    await cv(page, '[data-testid="discard-draft-dialog-confirm"]', 900)
    await branding_part2(page)


async def branding_part2(page):
    voices = ['brand-voice-hc-core']
    await tab(page, "home")
    act = await txt(page, '[data-testid="recent-activity-card"]') or ""
    ck("activity Updated brand settings", "brand settings" in act.lower(), act[:200])
    # delete the non-default voice (seed voice other than default)
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-branding"]', 1200)
    other = voices[0]
    await cv(page, f'[data-testid="{other}"]', 1000)
    ck("delete shown for non-default", await vis(page, '[data-testid="voice-delete-button"]'))
    await cv(page, '[data-testid="voice-delete-button"]', 500)
    await cv(page, '[data-testid="delete-voice-dialog-confirm"]', 1000)
    ck("voice deleted", not await vis(page, f'[data-testid="{other}"]'))
    # creator read-only
    await switch_role(page, "editor")
    await tab(page, "more")
    mods = [m.split("|")[0] for m in await visible_ids(page, "more-module-")]
    print("CREATOR MODULES", mods)
    ck("creator no team/publish", "more-module-team" not in mods and "more-module-publish" not in mods)
    await cv(page, '[data-testid="more-module-branding"]', 1200)
    ck("creator readonly", await vis(page, '[data-testid="brand-readonly-note"]') and not await vis(page, '[data-testid="brand-name-input"]') and not await vis(page, '[data-testid="brand-add-voice"]'))


async def team_ids(page):
    return [m.split("|")[0].replace("team-member-", "") for m in await visible_ids(page, "team-member-")]


async def team_flow(page):
    await enter(page, "super_admin")
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-team"]', 1200)
    ids = await team_ids(page)
    ck("team list", all(x in ids for x in ["rohi", "aisha", "dev", "nikhil", "meera", "sam"]), ids)
    ck("sam Invited", "Invited" in (await txt(page, '[data-testid="team-status-sam"]') or ""))
    for f in ["super_admin", "admin", "editor", "publisher", "all"]:
        await cv(page, f'[data-testid="team-filter-{f}"]', 400)
        print("FILTER", f, await team_ids(page))
    await fill(page, "team-search-input", "meer")
    ck("search meera", await team_ids(page) == ["meera"], await team_ids(page))
    await fill(page, "team-search-input", "zzzz")
    ck("empty state", await vis(page, '[data-testid="team-empty"]'))
    await fill(page, "team-search-input", "")
    # invite
    await cv(page, '[data-testid="team-invite-button"]', 1000)
    roles = [r.split("|")[0] for r in await visible_ids(page, "invite-role-")]
    print("SA INVITE ROLES", roles)
    await cv(page, '[data-testid="form-save-button"]', 500)
    ck("invite name error", await vis(page, '[data-testid="invite-name-input-error"]'))
    await fill(page, "invite-name-input", "TEST Priya")
    await fill(page, "invite-email-input", "bad-email")
    await cv(page, '[data-testid="form-save-button"]', 500)
    ck("invalid email error", await vis(page, '[data-testid="invite-email-input-error"]'), await txt(page, '[data-testid="invite-email-input-error"]'))
    await fill(page, "invite-email-input", "DEV@herbalcare.demo")
    await cv(page, '[data-testid="form-save-button"]', 500)
    ck("duplicate email error", await vis(page, '[data-testid="invite-email-input-error"]'), await txt(page, '[data-testid="invite-email-input-error"]'))
    await fill(page, "invite-email-input", "priya@test.demo")
    await fill(page, "invite-title-input", "Writer")
    await cv(page, '[data-testid="invite-role-editor"]', 300)
    await cv(page, '[data-testid="form-save-button"]', 1200)
    ck("new member profile Invited", await vis(page, '[data-testid="member-profile-screen"]') and (await txt(page, '[data-testid="member-status"]')) == "Invited")
    ck("resend/accept visible", await vis(page, '[data-testid="member-resend-invite"]') and await vis(page, '[data-testid="member-accept-invite"]'))
    await cv(page, '[data-testid="member-resend-invite"]', 500)
    await cv(page, '[data-testid="member-accept-invite"]', 600)
    ck("accepted -> Active", (await txt(page, '[data-testid="member-status"]')) == "Active")
    # role change
    await cv(page, '[data-testid="member-role-option-publisher"]', 600)
    ck("role changed", (await txt(page, '[data-testid="member-role"]')) == "Publisher", await txt(page, '[data-testid="member-role"]'))
    await fill(page, "member-title-input", "Senior writer")
    await cv(page, '[data-testid="member-title-save"]', 600)
    ck("title saved (button hidden)", not await vis(page, '[data-testid="member-title-save"]'))
    # assign task
    await cv(page, '[data-testid="member-assign-task"]', 1000)
    sel = await selected(page, "task-assignee-option-")
    ck("assignee preselected", any("task-assignee-option-p" in s for s in sel), sel)
    await fill(page, "task-title-input", "TEST_ assigned task")
    await cv(page, '[data-testid^="task-campaign-option-"]', 300)
    await cv(page, '[data-testid="form-save-button"]', 1200)
    print("AFTER TASK SAVE screen:", page.url)
    if not await vis(page, '[data-testid="member-profile-screen"]'):
        await cv(page, '[data-testid="header-back-button"]', 900)
    ck("task in member open tasks", "TEST_ assigned task" in (await txt(page, '[data-testid="member-tasks"]') or ""), page.url)
    # deactivate -> hidden from assignee options
    await cv(page, '[data-testid="member-deactivate"]', 600)
    ck("deactivated", (await txt(page, '[data-testid="member-status"]')) == "Deactivated" and not await vis(page, '[data-testid="member-assign-task"]'))
    mid = page.url.rstrip("/").split("/")[-1]
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="team-member-meera"]', 1000)
    await cv(page, '[data-testid="member-assign-task"]', 1000)
    opts = [o.split("|")[0] for o in await visible_ids(page, "task-assignee-option-")]
    ck("deactivated hidden from assignees", f"task-assignee-option-{mid}" not in opts, opts)
    await cv(page, '[data-testid="form-close-button"]', 900)
    # persona locked
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="team-member-dev"]', 1000)
    ck("persona role locked", await vis(page, '[data-testid="member-role-locked"]') and not await vis(page, '[data-testid="member-remove"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="team-member-rohi"]', 1000)
    ck("own profile no manage", not await vis(page, '[data-testid="member-manage"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    # reactivate + remove new member: open tasks go to remover
    await cv(page, f'[data-testid="team-member-{mid}"]', 1000)
    await cv(page, '[data-testid="member-reactivate"]', 600)
    ck("reactivated", (await txt(page, '[data-testid="member-status"]')) == "Active")
    await cv(page, '[data-testid="member-remove"]', 600)
    await cv(page, '[data-testid="remove-member-dialog-confirm"]', 1200)
    ck("removed from list", mid not in await team_ids(page), page.url)
    await cv(page, '[data-testid="team-member-rohi"]', 1000)
    ck("task reassigned to remover", "TEST_ assigned task" in (await txt(page, '[data-testid="member-tasks"]') or ""))
    await cv(page, '[data-testid="header-back-button"]', 900)
    await tab(page, "home")
    act = await txt(page, '[data-testid="recent-activity-card"]') or ""
    print("TEAM ACTIVITY", act[:400])
    ck("activity invited", "invited a team member" in act.lower() or "removed a team member" in act.lower())
    # Owner/Admin (aisha)
    await switch_role(page, "admin")
    await tab(page, "more")
    await cv(page, '[data-testid="more-module-team"]', 1200)
    await cv(page, '[data-testid="team-invite-button"]', 1000)
    roles = [r.split("|")[0] for r in await visible_ids(page, "invite-role-")]
    ck("admin no manager roles", "invite-role-super_admin" not in roles and "invite-role-admin" not in roles, roles)
    await cv(page, '[data-testid="form-close-button"]', 900)
    await cv(page, '[data-testid="team-member-rohi"]', 1000)
    ck("admin sees rohi readonly", await vis(page, '[data-testid="member-readonly-note"]') and not await vis(page, '[data-testid="member-manage"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="team-member-meera"]', 1000)
    ropts = [r.split("|")[0] for r in await visible_ids(page, "member-role-option-")]
    ck("admin manages meera without manager roles", await vis(page, '[data-testid="member-manage"]') and "member-role-option-admin" not in ropts, ropts)


async def sizes(page, sel):
    return await page.locator(sel).evaluate_all(
        "els => els.filter(e=>e.offsetParent).slice(0,3).map(e => {const r=e.getBoundingClientRect(); return e.getAttribute('data-testid')+':'+Math.round(r.width)+'x'+Math.round(r.height)})")


async def misc_flow(page):
    await enter(page, "admin")
    n0 = await txt(page, '[data-testid="summary-count-scheduled"]')
    await cv(page, '[data-testid="summary-card-scheduled"]', 1200)
    ck("home scheduled card -> publish", await vis(page, '[data-testid="publish-screen"]'))
    for s in ['[data-testid="publish-cal-prev"]', '[data-testid^="publish-day-"]', '[data-testid^="publish-view-"]']:
        print("SIZE", await sizes(page, s))
    dots = await page.locator('[data-testid="publish-day-2026-09-23"]').first.evaluate(
        "e => Array.from(e.querySelectorAll('div')).filter(d=>d.childElementCount===0 && d.getBoundingClientRect().width<=8 && d.getBoundingClientRect().width>0).map(d=>getComputedStyle(d).backgroundColor)")
    print("DOTS 23", dots, await page.locator('[data-testid="publish-day-2026-09-23"]').first.get_attribute("aria-label"))
    await cv(page, '[data-testid="publish-view-list"]', 400)
    print("SIZE filters", await sizes(page, '[data-testid^="publish-filter-"]'))
    await cv(page, '[data-testid="publish-new-button"]', 1000)
    print("SIZE time", await sizes(page, '[data-testid^="post-time-input-"]'))
    print("SIZE channel", await sizes(page, '[data-testid^="post-channel-option-"]'))
    await fill(page, "post-title-input", "TEST_ admin post")
    await cv(page, '[data-testid="post-channel-option-linkedin"]', 300)
    await cv(page, '[data-testid="post-time-input-slot-1300"]', 300)
    await cv(page, '[data-testid="form-save-button"]', 1200)
    ck("admin scheduled", await vis(page, '[data-testid="post-detail-screen"]'))
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="post-row-s1"]', 1000)
    await cv(page, '[data-testid="post-publish-now"]', 1800)
    await cv(page, '[data-testid="header-back-button"]', 900)
    await cv(page, '[data-testid="header-back-button"]', 900)
    await tab(page, "home")
    n1 = await txt(page, '[data-testid="summary-count-scheduled"]')
    ck("scheduled count +1 -1", n0 == n1, f"{n0}->{n1}")
    act = await txt(page, '[data-testid="recent-activity-card"]') or ""
    print("ADMIN ACTIVITY", act[:500])
    ck("activity has (demo) publish entry", "(demo)" in act)
