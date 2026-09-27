// Optional real-Chromium acceptance suite; no added application dependency.
// Start Vite (or preview), then set PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE
// if browser tooling is installed externally. REPORT_PATH is optional.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const report = { browser: browser.version(), base, viewports: [], regressions: {} };
const snapshot = v => ({
  currentSrc: v.currentSrc.startsWith("data:") ? "data:video/mp4;base64,…" : v.currentSrc,
  readyState: v.readyState, paused: v.paused, duration: v.duration,
  currentTime: v.currentTime, frames: v.getVideoPlaybackQuality().totalVideoFrames,
  controls: v.controls, autoplay: v.autoplay, loop: v.loop, playsInline: v.playsInline,
  preload: v.preload, opacity: getComputedStyle(v).opacity,
});
const posterVisible = page => page.waitForFunction(() => getComputedStyle(document.querySelector("#art-of-gold img")).opacity === "1");
try {
  for (const [width, height] of [[1280,800], [1536,864], [1024,768], [768,1024], [375,812]]) {
    const touch = width < 1024;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
    const page = await context.newPage();
    const result = { width, height, errors: [], failedRequests: [], network: [] };
    page.on("pageerror", e => result.errors.push(e.message));
    page.on("requestfailed", q => result.failedRequests.push({ url: q.url(), error: q.failure()?.errorText }));
    page.on("response", r => {
      if (/art-of-gold-(web\.mp4|poster\.jpg)$/.test(r.url())) result.network.push({ url:r.url(), status:r.status(), type:r.headers()["content-type"], range:r.headers()["content-range"] });
    });
    await page.goto(base);
    const section = page.locator("#art-of-gold"), video = section.locator("video"), poster = section.locator("img"), play = section.locator("button");
    await section.waitFor();
    result.beforeScroll = await video.evaluate(snapshot);
    assert.equal(result.beforeScroll.preload, "none");
    assert.equal(result.beforeScroll.paused, true);
    assert.equal(result.network.filter(r => r.type === "video/mp4").length, 0);
    await section.scrollIntoViewIfNeeded();
    await poster.evaluate(i => i.decode());
    await posterVisible(page);
    result.buttonLabel = await play.getAttribute("aria-label");
    assert.equal(result.buttonLabel, "Play the art of gold film");
    const geometry = () => video.evaluate(v => { const r=v.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top+scrollY,left:r.left}; });
    result.geometry = await geometry();
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/craft-poster-${width}.png` });
    if (touch) await play.tap(); else { await play.focus(); await page.keyboard.press("Enter"); }
    await page.waitForFunction(() => document.querySelector("#art-of-gold video")?.currentTime > 0.1);
    result.t1 = await video.evaluate(snapshot);
    await page.waitForTimeout(1400);
    result.t2 = await video.evaluate(snapshot);
    assert.ok(result.t2.currentTime > result.t1.currentTime);
    assert.ok(result.t2.frames > result.t1.frames);
    assert.equal(result.t2.paused, false);
    assert.equal(result.t2.readyState, 4);
    assert.ok(Math.abs(result.t2.duration - 100/3) < 0.002);
    assert.equal(result.t2.opacity, "1");
    assert.equal(await poster.evaluate(i => getComputedStyle(i).opacity), "0");
    assert.equal(result.t2.autoplay, false);
    assert.equal(result.t2.loop, false);
    assert.equal(result.t2.playsInline, true);
    assert.equal(result.t2.controls, true);
    await video.evaluate(v => v.pause()); await posterVisible(page);
    result.pause = await video.evaluate(snapshot);
    assert.equal(result.pause.paused, true);
    await play.click(); await page.waitForTimeout(1000);
    result.resume = await video.evaluate(snapshot);
    assert.ok(result.resume.currentTime > result.pause.currentTime);
    // First viewport watches the complete film. Others exercise genuine ended
    // events by seeking close to the end, not by dispatching synthetic events.
    if (width !== 1280) await video.evaluate(v => { v.currentTime=v.duration-0.25; });
    await page.waitForFunction(() => {const v=document.querySelector("#art-of-gold video"); return v.paused && v.currentTime===0;}, null, { timeout:45000 });
    await posterVisible(page);
    result.ended = await video.evaluate(snapshot);
    result.naturalCompletion = width === 1280;
    await play.click(); await page.waitForTimeout(1100);
    result.replay = await video.evaluate(snapshot);
    assert.ok(result.replay.currentTime > 0);
    assert.equal(result.replay.paused, false);
    assert.deepEqual(await geometry(), result.geometry);
    assert.ok(Math.abs(result.geometry.width/result.geometry.height-16/9) < 0.025);
    result.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(result.overflow, false);
    assert.deepEqual(result.errors, []);
    assert.ok(result.network.every(r => [200,206].includes(r.status)));
    report.viewports.push(result);
    console.log(`CRAFT ${width}×${height}: ${result.t1.currentTime} → ${result.t2.currentTime}, pause/resume/end/replay pass`);
    await context.close();
  }

  // Desktop hero cycle and photographic (never video) product hover.
  {
    const context = await browser.newContext({viewport:{width:1280,height:800}}), page=await context.newPage();
    await page.goto(base);
    await page.waitForFunction(() => document.querySelector(".hero video")?.currentTime > 0.1);
    const first=await page.locator(".hero").getAttribute("data-hero-active");
    const t1=await page.locator(".hero video").first().evaluate(snapshot);
    await page.waitForTimeout(1200);
    const t2=await page.locator(".hero video").first().evaluate(snapshot);
    assert.ok(t2.currentTime>t1.currentTime);
    const cycle=[first];
    for (let i=0;i<4;i++) {
      await page.waitForFunction(previous => document.querySelector(".hero")?.dataset.heroActive !== previous, cycle.at(-1), {timeout:16000});
      cycle.push(await page.locator(".hero").getAttribute("data-hero-active"));
    }
    assert.deepEqual(cycle,["signature-gold","bridal-gold","contemporary","heritage-statement","signature-gold"]);
    report.regressions.hero={t1,t2,cycle};
    await page.goto(base+"/products");
    const link=page.locator('article a[href="/product/JWL-001"]').first();await link.waitFor();
    const card=link.locator("xpath=ancestor::article");
    assert.equal(await card.locator("video").count(),0);
    assert.equal(await card.locator(".product-media-layers").count(),0);
    await card.locator("img").first().evaluate(i=>i.decode());
    await link.hover();
    const sequence=[];
    for (const count of [1,2,3]) {
      await page.waitForFunction(count => document.querySelectorAll('.product-media-frame[data-shown="true"]').length>=count, count);
      sequence.push(await card.locator('.product-media-frame[data-shown="true"]').count());
    }
    assert.deepEqual(sequence,[1,2,3]);
    const wish=card.locator("button[aria-pressed]").first();const old=await wish.getAttribute("aria-pressed");await wish.click();assert.notEqual(await wish.getAttribute("aria-pressed"),old);
    await page.mouse.move(0,0);await page.waitForTimeout(900);
    assert.equal(await card.locator(".product-media-layers").getAttribute("data-engaged"),"false");
    assert.equal(await card.locator(".product-media-layers").evaluate(e=>getComputedStyle(e).opacity),"0");
    await link.click();await page.waitForURL("**/product/JWL-001");
    report.regressions.product={sequence,wishlist:true,navigation:true,mouseLeave:true,imagesOnly:true};
    await context.close();
  }
  for (const mode of ["mobile","reduced","failed","blocked"]) {
    const context=await browser.newContext({viewport:{width:mode==="mobile"?375:1280,height:812},isMobile:mode==="mobile",hasTouch:mode==="mobile",reducedMotion:mode==="reduced"?"reduce":"no-preference"});
    const page=await context.newPage();
    if(mode==="failed") await page.route("**/*.mp4",r=>r.abort());
    if(mode==="blocked") await page.addInitScript(() => {
      const original=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){
        if(this.src.includes("art-of-gold-web")) return Promise.reject(new DOMException("Test policy rejection","NotAllowedError"));
        return original.call(this);
      };
    });
    await page.goto(base);await page.locator("#art-of-gold").waitFor();
    if(mode==="mobile") {
      await page.waitForFunction(()=>document.querySelector(".hero video")?.currentTime>0.1);
      report.regressions.mobileHero=await page.locator(".hero video").first().evaluate(snapshot);
    }
    if(mode==="reduced") {
      assert.equal(await page.locator(".hero video, #art-of-gold video, #art-of-gold button").count(),0);
      await page.locator("#art-of-gold").scrollIntoViewIfNeeded();await posterVisible(page);
      report.regressions.reducedPosters=true;
    }
    if(mode==="failed") {
      await page.waitForFunction(()=>document.querySelector(".hero")?.dataset.heroMode==="poster");
      await page.locator("#art-of-gold").scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>!document.querySelector("#art-of-gold video"));
      assert.equal(await page.locator("#art-of-gold button").count(),0);await posterVisible(page);
      report.regressions.failedMediaPosters=true;
    }
    if(mode==="blocked") {
      await page.locator("#art-of-gold").scrollIntoViewIfNeeded();await page.locator("#art-of-gold button").click();
      await page.waitForTimeout(800);await posterVisible(page);
      const state=await page.locator("#art-of-gold video").evaluate(snapshot);assert.equal(state.paused,true);assert.equal(state.currentTime,0);
      assert.equal(await page.locator("#art-of-gold button").count(),1);report.regressions.blockedPlaybackPoster=true;
    }
    if(["mobile","reduced"].includes(mode)) {
      await page.goto(base+"/products");const link=page.locator('article a[href="/product/JWL-001"]').first();await link.waitFor();await link.hover();await page.waitForTimeout(1800);
      assert.equal(await page.locator(".product-media-layers").count(),0);
      report.regressions[mode+"StaticCards"]=true;
    }
    await context.close();
  }
  console.log("PASS: five viewport playback runs, hero full cycle, product interactions and fallback/reduced-motion checks");
} catch (error) {
  report.failure=error.stack;process.exitCode=1;console.error(error);
} finally {
  if(process.env.REPORT_PATH) writeFileSync(process.env.REPORT_PATH,JSON.stringify(report,null,2));
  await browser.close();
}
