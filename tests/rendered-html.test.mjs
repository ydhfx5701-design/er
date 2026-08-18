import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the new tiny-sideview Waggle Town shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>와글타운 \| Waggle Town<\/title>/i);
  assert.match(html, /aria-label="와글타운 작은 주민의 2D 사이드뷰 마을"/);
  assert.match(html, /data-testid="mobile-pixel-hud"/);
  assert.match(html, /data-testid="bottom-menu"/);
  assert.match(html, /작은 마을 · 단계/);
  assert.match(html, /src="\/ui-icons\/town\.png"/);
  assert.match(html, /src="\/ui-icons\/build\.png"/);
  assert.doesNotMatch(html, /[▦♟✦◇◆≡⚙]/);
  assert.match(html, />건설<\/span>/);
  assert.match(html, />주민<\/span>/);
  assert.match(html, />스킬<\/span>/);
  assert.match(html, />방어<\/span>/);
  assert.match(html, />자원<\/span>/);
  assert.match(html, />기록<\/span>/);
  assert.match(html, />설정<\/span>/);
  assert.match(html, />2×<\/button>/);
  assert.doesNotMatch(html, /SURFACE MINE LINE/);
  assert.doesNotMatch(html, /class="qa-panel"/);
});

test("uses a shared text-free pixel UI kit across HUD, dock, drawers, and modal panels", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ui-final.css", import.meta.url), "utf8"),
  ]);
  const requiredIcons = ["town", "event", "build", "residents", "skills", "defense", "resources", "records", "settings", "coin", "wood", "food", "stone", "metal", "crystal", "shield", "check", "cancel-x", "arrow-up", "warning", "close", "rally", "retreat", "focus"];
  await Promise.all(requiredIcons.map((name) => access(new URL(`../public/ui-icons/${name}.png`, import.meta.url))));
  const icon = await readFile(new URL("../public/ui-icons/build.png", import.meta.url));
  assert.equal(icon.subarray(1, 4).toString("ascii"), "PNG");
  assert.match(page, /function PixelIcon/);
  assert.match(page, /const RESOURCE_UI/);
  assert.match(page, /className="raid-bar/);
  assert.match(page, /className="combat-commands/);
  assert.match(page, /className={`pixel-switch/);
  assert.doesNotMatch(page, /icon:"[▦♟✦◇◆≡⚙]"/);
  assert.doesNotMatch(page, /<i>\{label\[0\]\}<\/i>/);
  assert.match(css, /image-rendering:pixelated/);
  assert.match(css, /transform:translateY\(2px\)/);
  assert.match(css, /@media \(max-width:950px\),\(max-height:470px\)/);
  assert.match(css, /env\(safe-area-inset-left\)/);
  assert.match(css, /touch-action:pan-x pan-y/);
});

test("keeps the sprite-rig village, surface quarry, combat, and spatial mining audio logic", async () => {
  const [page, layout, packageJson, rigManifestText, alphaAuditText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/game-assets/characters-v2/manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../public/game-assets/characters-v2/alpha-audit.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function drawPixelBackdrop/);
  assert.match(page, /function drawPixelGround/);
  assert.match(page, /function drawPixelBuilding/);
  assert.match(page, /function drawSurfaceQuarry/);
  assert.match(page, /function drawTinyVillager/);
  assert.match(page, /function drawTinyEnemy/);
  assert.match(page, /function drawTinyEquipment/);
  assert.match(page, /type CharacterState = "IDLE" \| "WALK" \| "WORK" \| "CARRY" \| "ATTACK" \| "AIM" \| "DEFEND" \| "EAT" \| "DRINK" \| "TALK" \| "SLEEP"/);
  assert.match(page, /const CHARACTER_RIG=/);
  assert.match(page, /leftFootSocket/);
  assert.match(page, /rightFootSocket/);
  assert.match(page, /if\(v\.facing===1\)ctx\.scale\(-1,1\)/);
  assert.match(page, /characterRigs/);
  assert.match(page, /phase1-character-qa/);
  assert.doesNotMatch(page, /function drawTinyHat/);
  assert.doesNotMatch(page, /function tinyJobColor/);
  assert.match(page, /function drawPixelCombatEffects/);
  assert.match(page, /const MOUNTAIN=/);
  assert.match(page, /function ensureVillagerSafe/);
  assert.match(page, /function miningSlotPoint/);
  assert.match(page, /function takeGroundShardBundle/);
  assert.match(page, /function updateMountain/);
  assert.match(page, /function deliverOre/);
  assert.doesNotMatch(page, /MINE_SITES/);
  assert.doesNotMatch(page, /UNDERGROUND MINE/);
  assert.match(page, /workStrikeTimer/);
  assert.match(page, /queueQuarrySound\(model,"mining_hit",point\.x,point\.y,v\.id\)/);
  assert.match(page, /sfx-mine\.mp3/);
  assert.match(page, /Math\.pow\(clamp\(1-dist\/1850,0,1\),1\.35\)/);
  assert.match(page, /\(event\.type==="mine"\|\|event\.type==="cannon"\)&&dist>1850/);
  assert.match(page, /clear:new Audio\(assetUrl\("game-assets\/audio\/bgm-clear\.mp3"\)\)/);
  assert.match(page, /rain:new Audio\(assetUrl\("game-assets\/audio\/bgm-rain\.mp3"\)\)/);
  assert.match(page, /function balanceHomes/);
  assert.match(page, /function raidTypesForDay/);
  assert.match(page, /function triggerDailyEvents/);
  assert.match(page, /function gainExperience/);
  assert.match(page, /professionLevels:Record<JobId,number>/);
  assert.match(page, /function professionMultiplier/);
  assert.match(page, /const upgradeProfession=/);
  assert.match(page, /data-testid="unified-skill-tree"/);
  assert.doesNotMatch(page, /const investStat=/);
  assert.doesNotMatch(page, /const learnJobSkill=/);
  assert.doesNotMatch(page, /const promoteVillager=/);
  assert.doesNotMatch(page, /const toggleAutoTrain=/);
  assert.match(page, /const changeVillagerJob=/);
  assert.match(page, /const startMoveBuilding=/);
  assert.match(page, /const demolishBuilding=/);
  assert.match(page, /"masonry" \| "school" \| "chapel" \| "garden" \| "training"/);
  assert.match(page, /CHARACTER_IDS\.map\(\(jobId\)=>/);
  assert.match(page, /마을 통합 특성/);
  assert.match(page, /모든 성장 스킬을 한 트리에서 관리합니다/);
  assert.match(page, /갑작스런 소나기/);
  assert.match(page, /도구 분실 소동/);
  assert.match(page, /const MILITARY_EQUIPMENT/);
  assert.match(page, /combatCommand==="focus"/);
  assert.match(page, /combatCommand==="retreat"/);
  assert.match(page, /issueCombatCommand\("rally"\)/);
  assert.match(page, /issueCombatCommand\("focus"\)/);
  assert.match(page, /sfxAudit\.sword\+sfxAudit\.spear\+sfxAudit\.arrow/);
  assert.match(layout, /title:\s*"와글타운 \| Waggle Town"/);
  assert.match(packageJson, /"build":\s*"vinext build"/);

  const rigManifest = JSON.parse(rigManifestText);
  const alphaAudit = JSON.parse(alphaAuditText);
  assert.equal(Object.keys(rigManifest).length, 39);
  assert.equal(alphaAudit.jobs, 39);
  assert.equal(alphaAudit.passed, true);
  assert.equal(alphaAudit.assets.length, 39);
  assert.equal(alphaAudit.assets.flatMap((item) => [item.body, item.leftFoot, item.rightFoot]).reduce((sum, item) => sum + item.borderAlpha, 0), 0);
  await Promise.all(Object.values(rigManifest).flatMap((rig) => [rig.body, rig.leftFoot, rig.rightFoot]).map((url) => access(new URL(`../public${url}`, import.meta.url))));

  await Promise.all([
    access(new URL("../public/game-assets/audio/sfx-mine.mp3", import.meta.url)),
    access(new URL("../public/game-assets/audio/bgm-clear.mp3", import.meta.url)),
    access(new URL("../public/game-assets/audio/bgm-rain.mp3", import.meta.url)),
    access(new URL("../public/game-assets/audio/sfx-sword.mp3", import.meta.url)),
    access(new URL("../public/game-assets/audio/sfx-spear.mp3", import.meta.url)),
    access(new URL("../public/game-assets/audio/sfx-arrow.mp3", import.meta.url)),
    access(new URL("../public/game-assets/artillery/cannon.mp3", import.meta.url)),
  ]);

  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});

test("implements phase three as a mineable PixelGrid with block logistics and stable falling pixels", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /type NavLayer = "surface" \| "building";/);
  assert.match(page, /interface NavPoint extends Point \{ layer:NavLayer; kind\?:"road"\|"ladder"\|"floor"; accessX\?:number \}/);
  assert.doesNotMatch(page, /type NavLayer = "surface" \| "mine"/);
  assert.doesNotMatch(page, /surfaceMines/);
  assert.doesNotMatch(page, /mineLamp/);
  assert.doesNotMatch(page, /"portal"/);
  assert.match(page, /const PIXEL_GRID=\{cols:112,rows:92,cellSize:7,chunkSize:32\}/);
  assert.match(page, /const MOUNTAIN=\{x:-1480,w:PIXEL_GRID\.cols\*PIXEL_GRID\.cellSize,groundY:BUILDING_BASELINE,stockpileX:-1590,depotX:-1790,artilleryX:-1950,slotCount:15\}/);
  assert.match(page, /const BlockType=\{EMPTY:0,STONE:1,IRON:2,COPPER:3,GOLD:4,RARE:5\}/);
  assert.match(page, /interface MountainState \{\s*capacity:number; cols:number; rows:number; cellSize:number; cells:number\[\]; hp:number\[\]; initialBlocks:number/);
  assert.match(page, /interface FallingRock \{ id:number; column:number; height:number; velocity:number; type:Exclude<PixelBlockType,0>/);
  assert.match(page, /interface QuarryResourcePixel/);
  assert.match(page, /function mountainSurfaceHeight/);
  assert.match(page, /function exposedMountainBlocks/);
  assert.match(page, /function damagePixelBlock/);
  assert.match(page, /mountain\.cells\[target\]=BlockType\.EMPTY/);
  assert.match(page, /mountain\.loose\.push/);
  assert.match(page, /function settleMountainColumns/);
  assert.match(page, /function addFallingBlockToGrid/);
  assert.match(page, /mountain\.cells\[index\]=rock\.type/);
  assert.match(page, /ctx\.imageSmoothingEnabled=false/);
  assert.doesNotMatch(page, /MOUNTAIN_PROFILE/);
  assert.doesNotMatch(page, /stacked-rock-/);
  assert.match(page, /const EMPTY_QUARRY_SOUND_SLOTS:Record<QuarrySoundSlot,number>=\{stone_fall:0,mining_hit:0,ore_pickup:0,carry_drop:0,storage_deposit:0\}/);
  assert.match(page, /if\(slot==="mining_hit"\)model\.soundEvents\.push\(\{type:"mine",x,y,sourceId\}\)/);
  assert.match(page, /queueQuarrySound\(model,"stone_fall"/);
  assert.match(page, /mountain\.stats\.mined\+\+/);
  assert.match(page, /mountain\.stats\.staged\+\+/);
  assert.match(page, /model\.mountain\.stats\.pickedUp\+=bundle\.count/);
  assert.match(page, /model\.mountain\.stats\.deposited\+=deposited/);
  assert.match(page, /function quarryStorageCapacity/);
  assert.match(page, /DEFAULT_QUARRY_UPGRADES:QuarryUpgrades=\{miningSpeed:0,rareFind:0,carrySpeed:0,carryCapacity:0,regenSpeed:0,storageCapacity:0\}/);
  assert.match(page, /for\(let index=0;index<5;index\+\+\)/);
  assert.match(page, /for\(let index=0;index<3;index\+\+\)/);
  assert.match(page, /for\(let tick=0;tick<1200;tick\+\+\)/);
  assert.match(page, /data-testid="phase3-quarry-qa"/);
  assert.match(page, /data-grid-blocks=/);
  assert.match(page, /data-loose-pixels=/);
  assert.match(page, /data-unsupported=/);
  assert.match(page, /data-block-adds=/);
  assert.match(page, /data-work-motion-violations=/);
  assert.match(page, /data-slot-collisions=/);
  assert.match(page, /data-miner-xs=/);
  assert.match(page, /PHASE 3 · 우측 직접 운반 \/ 제한 적재/);
  assert.match(page, /data-miners-right=/);
  assert.match(page, /data-miner-carry=/);
  assert.match(page, /data-miner-picked-up=/);
  assert.match(page, /data-miner-deposited=/);
  assert.match(page, /data-pickup-exact=/);
  assert.match(page, /data-pile-bounded=/);
});

test("adds right-side miners, bounded artillery shard piles, and exact physical hauling", async () => {
  const [page, artilleryAuditText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/game-assets/artillery/alpha-audit.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /\| "ARTILLERY"/);
  assert.match(page, /ARTILLERY:"대포병"/);
  assert.match(page, /function ensureArtilleryResident/);
  assert.match(page, /function quarryArtilleryPoint/);
  assert.match(page, /function spawnShardsFromDestroyedBlocks/);
  assert.match(page, /mountain\.stats\.spawned\+=spawned/);
  assert.match(page, /function launchQuarryCannonball/);
  assert.match(page, /function explodeQuarryCannon/);
  assert.match(page, /function updateArtilleryMining/);
  assert.match(page, /function processQuarryStorage/);
  assert.match(page, /processQuarryStorage\(model,dt\);refreshArtilleryPileGate/);
  assert.doesNotMatch(page, /if\(model\.attackStarted\|\|!working\|\|v\.lifeState==="SLEEP"/);
  assert.match(page, /const QUARRY_SHARD_FLOW=\{pauseAt:96,resumeAt:72,maxPileHeight:54/);
  assert.match(page, /function refreshArtilleryPileGate/);
  assert.match(page, /mountain\.artilleryPaused=true;mountain\.stats\.artilleryPauses\+\+/);
  assert.match(page, /mountain\.artilleryPaused=false;mountain\.stats\.artilleryResumes\+\+/);
  assert.match(page, /m\.mountain\.stats\.artilleryPauses>0&&m\.mountain\.stats\.artilleryResumes>0&&!m\.mountain\.artilleryPaused/);
  assert.match(page, /phase3Pass=snapshot\.quarryStats\.artilleryResumes>0/);
  assert.match(page, /model\.mountain\.cannonShots\.length===0/);
  assert.match(page, /!model\.mountain\.loose\.some\(\(pixel\)=>!pixel\.settled&&pixel\.ownerId\.startsWith\("VALID_CANNON_IMPACT"\)\)/);
  assert.match(page, /destroyMountainBlocksAtImpact\(model,impactWorldPosition,2\)/);
  assert.match(page, /function quarryArtilleryRestPoint/);
  assert.match(page, /function shardSupportHeightAt/);
  assert.match(page, /function shardPileLane/);
  assert.match(page, /shardPileLane\(other\.x\)!==lane/);
  assert.match(page, /QUARRY_SHARD_FLOW\.maxPileHeight-7/);
  assert.match(page, /function shardLandingPoint/);
  assert.match(page, /return\{x,height:shardSupportHeightAt\(mountain,pixel,x\)\}/);
  assert.match(page, /const directSupport=shardSupportHeightAt\(mountain,pixel,pixel\.x\)/);
  assert.match(page, /pixel\.x=landing\.x;pixel\.height=landing\.height/);
  assert.match(page, /function settleRemainingShardPile/);
  assert.match(page, /const rightStart=Math\.floor\(mountain\.cols\*\.56\)/);
  assert.match(page, /v\.facing=-1/);
  assert.match(page, /function quarryMinerDropPoint/);
  assert.match(page, /mountain\.stats\.minerPickedUp\+=count/);
  assert.match(page, /model\.mountain\.stats\.minerDeposited\+=deposited/);
  assert.doesNotMatch(page, /sourceType:"VALID_MINING_HIT"/);
  assert.match(page, /v\.targetX=v\.x;v\.targetY=BUILDING_BASELINE/);
  assert.match(page, /kind:"cannonball" as ProjectileKind/);
  assert.match(page, /gravity=kind==="cannonball"\?330/);
  assert.match(page, /pushCombatEffect\(model,"muzzle"/);
  assert.match(page, /pushCombatEffect\(model,"explosion"/);
  assert.match(page, /pixel\.settled=true/);
  assert.match(page, /Math\.max\(pixel\.settled\?4:3/);
  assert.match(page, /data-live-settled-shards=/);
  assert.match(page, /data-live-spawned-shards=/);
  assert.match(page, /data-live-accounted-shards=/);
  assert.match(page, /data-live-pile-height=/);
  assert.match(page, /data-live-picked-up=/);
  assert.match(page, /data-live-deposited=/);
  assert.match(page, /data-live-pickup-count=/);
  assert.match(page, /data-live-pile-before-pickup=/);
  assert.match(page, /data-live-pile-after-pickup=/);
  assert.match(page, /data-live-pickup-exact=/);
  assert.match(page, /data-live-artillery-paused=/);
  assert.match(page, /data-live-artillery-pauses=/);
  assert.match(page, /data-live-artillery-resumes=/);
  assert.match(page, /data-live-miners-right=/);
  assert.match(page, /takeGroundShardBundle\(model\.mountain,v\.shardTargetIds\?\?\[\],3\+model\.mountain\.upgrades\.carryCapacity\)/);
  assert.match(page, /v\.carryingOre=bundle\.count/);
  assert.match(page, /bundle\.pileBefore/);
  assert.match(page, /bundle\.pileAfter/);
  assert.match(page, /for\(let item=0;item<count;item\+\+\)/);
  assert.match(page, /function drawQuarryPixelBlock/);
  assert.doesNotMatch(page, /ctx\.fillRect\(x-1,y-1,s\+2,s\+2\)/);
  assert.match(page, /assetUrl\("game-assets\/artillery\/fire\.png"\)/);
  assert.match(page, /assetUrl\("game-assets\/artillery\/cannon\.mp3"\)/);
  assert.match(page, /assetsRef\.current\.explosions=explosions/);
  assert.match(page, /if\(!isArtillery&&!isMounted\)\{ctx\.drawImage\(rig\.leftFoot/);
  assert.match(page, /bodyH=\(isArtillery\?42:isMounted\?40:CHARACTER_RIG\.bodyHeight\)\*unit/);
  assert.match(page, /bodyBob=isArtillery&&walking\?Math\.abs\(cycle\)\*\.72\*unit/);
  assert.match(page, /h=\(26\+progress\*7\)\*z/);

  const audit = JSON.parse(artilleryAuditText);
  for (const part of Object.values(audit)) {
    assert.equal(part.borderAlpha, 0);
    assert.ok(part.transparent > 0);
  }
  const assetUrls = [
    new URL("../public/game-assets/artillery/idle.png", import.meta.url),
    new URL("../public/game-assets/artillery/fire.png", import.meta.url),
    ...Array.from({ length: 8 }, (_, index) => new URL(`../public/game-assets/artillery/explosion/${index + 1}.png`, import.meta.url)),
  ];
  const pngs = await Promise.all(assetUrls.map((url) => readFile(url)));
  for (const png of pngs) assert.equal(png[25], 6, "artillery runtime assets must be true RGBA PNG files");
});

test("binds cannon destruction, explosion, and shards to one real PixelGrid impact", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /interface QuarryCannonShot \{[^}]*hasExploded:boolean/);
  assert.match(page, /function mountainWorldToCell/);
  assert.match(page, /localX=world\.x-MOUNTAIN\.x,localY=BUILDING_BASELINE-world\.y/);
  assert.match(page, /function firstMountainBlockOnSegment/);
  assert.match(page, /function destroyMountainBlocksAtImpact/);
  assert.match(page, /impactCell\.column\+dx,row=impactCell\.row\+dy/);
  assert.match(page, /function spawnShardsFromDestroyedBlocks/);
  assert.match(page, /if\(destroyedBlocks\.length===0\)return 0/);
  assert.match(page, /sourceType:"VALID_CANNON_IMPACT"/);
  assert.doesNotMatch(page, /sourceType:"VALID_MINING_HIT"/);
  assert.match(page, /v\.carryingOreKind=kind;v\.carryingOre=count/);
  assert.match(page, /바닥에 쌓지 않고 즉시 양손에 들어 반출해요/);
  assert.match(page, /pushCombatEffect\(model,"explosion",impactWorldPosition\.x,impactWorldPosition\.y/);
  assert.match(page, /model\.soundEvents\.push\(\{type:"cannon",x:impactWorldPosition\.x,y:impactWorldPosition\.y/);
  assert.match(page, /if\(shot\.hasExploded\)\{mountain\.stats\.duplicateImpacts\+\+;return 0;\}/);
  assert.match(page, /else if\(shot\.life<=0\)\{shot\.hasExploded=true;mountain\.stats\.cannonMisses\+\+;\}/);
  assert.match(page, /function runQuarryImpactAudit/);
  assert.match(page, /for\(let tick=0;tick<idleSeconds\*4;tick\+\+\)updateMountain\(idleModel,\.25\)/);
  assert.match(page, /data-testid="quarry-impact-audit"/);
  assert.match(page, /data-empty-shards=/);
  assert.match(page, /data-air-shards=/);
  assert.match(page, /data-idle-seconds=/);
  assert.match(page, /data-idle-shards=/);
  assert.doesNotMatch(page, /const mountain=model\.mountain,candidates=exposedMountainBlocks/);
  assert.doesNotMatch(page, /function spawnShardBurst/);
});

test("locks phase two to one grounded sideview row with fixed zoom and horizontal-only scrolling", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const ROAD_ROWS = \[BUILDING_BASELINE,BUILDING_BASELINE,BUILDING_BASELINE\]/);
  assert.match(page, /const SURFACE_NAV = \{ minX:WORLD\.minX\+80,maxX:WORLD\.maxX-80,minY:BUILDING_BASELINE,maxY:BUILDING_BASELINE \}/);
  assert.match(page, /function project\(point:Point,[\s\S]*?y:\(point\.y-camera\.y\)\*camera\.zoom\+height\/2/);
  assert.match(page, /function inverseProject\(x:number,y:number,[\s\S]*?y:\(y-height\/2\)\/camera\.zoom\+camera\.y/);
  assert.doesNotMatch(page, /const DEPTH\s*=\s*\.56/);
  assert.match(page, /function buildingGroundAnchor\(b:Building\):Point\{return\{x:b\.x,y:b\.groundY\};\}/);
  assert.match(page, /function buildingInteriorGroundY\(b:Building\)\{return b\.groundY;\}/);
  assert.match(page, /function normalizeBuildingLayout/);
  assert.match(page, /const SMALL_BUILDINGS=new Set<BuildingKind>/);
  assert.match(page, /const LARGE_BUILDINGS=new Set<BuildingKind>/);
  assert.match(page, /const OUTDOOR_BUILDINGS=new Set<BuildingKind>/);
  assert.match(page, /function buildingDimensions/);
  assert.match(page, /const placementValid=/);
  assert.match(page, /ghost\.valid\?"rgba\(70,210,115,\.22\)":"rgba\(230,74,74,\.24\)"/);
  assert.match(page, /ghost\.valid\?"#43c673":"#df4f4f"/);
  assert.match(page, /const FIXED_CAMERA=\{x:0,zoom:\.42,surfaceOffset:72\} as const/);
  assert.match(page, /const CAMERA_SCROLL=\{minX:-1600,maxX:4650\} as const/);
  assert.match(page, /camera\.x=clamp\(camera\.x,CAMERA_SCROLL\.minX,CAMERA_SCROLL\.maxX\);camera\.zoom=FIXED_CAMERA\.zoom/);
  assert.match(page, /cameraRef\.current\.x=clamp\(cameraRef\.current\.x\+delta\/FIXED_CAMERA\.zoom\*\.42,CAMERA_SCROLL\.minX,CAMERA_SCROLL\.maxX\)/);
  assert.match(page, /data-testid="phase2-sideview-qa"/);
  assert.match(page, /data-testid="fixed-idle-qa"/);
  assert.match(page, /while\(m\.villagers\.length<24\)/);
  assert.match(page, /useRef\(\{x:FIXED_CAMERA\.x,y:620,zoom:FIXED_CAMERA\.zoom\}\)/);
  assert.match(page, /const LAND_DEPTH = 58/);

  const pointerMove = page.match(/const pointerMove=[\s\S]*?\n  const pointerUp=/)?.[0] ?? "";
  assert.match(pointerMove, /cameraRef\.current\.x=clamp/);
  assert.doesNotMatch(pointerMove, /cameraRef\.current\.y\s*=/);
  assert.doesNotMatch(pointerMove, /cameraRef\.current\.zoom\s*=/);

  const initialOrder = page.match(/const order:BuildingKind\[\]=\[([^\]]+)\]/)?.[1] ?? "";
  const buildingKinds = initialOrder.match(/"[^"]+"/g) ?? [];
  assert.ok(buildingKinds.length >= 10, `expected at least 10 initial buildings, got ${buildingKinds.length}`);
});

test("implements phase four as role-based formation combat with four executable scenarios", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /type CombatState = "PATROL" \| "MOVE_TO_FORMATION" \| "HOLD_POSITION" \| "CHASE" \| "ATTACK" \| "AIM" \| "DEFEND" \| "HIT" \| "STUNNED" \| "RETREAT" \| "DOWN" \| "RECOVERY" \| "EVACUATE"/);
  assert.match(page, /type RaidType = "MELEE_RAID" \| "RANGED_RAID" \| "SHIELDED_RAID" \| "ELITE_RAID"/);
  assert.match(page, /const RAID_DEFINITIONS:Record<RaidType/);
  assert.match(page, /function formationPoint/);
  assert.match(page, /function resolveCombatSpacing/);
  assert.match(page, /function updateDownAndRecovery/);
  assert.match(page, /function launchProjectile/);
  assert.match(page, /kind:"arrow" as ProjectileKind/);
  assert.match(page, /kind:"bolt" as ProjectileKind/);
  assert.match(page, /kind:"stone" as ProjectileKind/);
  assert.match(page, /function finishCombat/);
  assert.match(page, /building\.hp=Math\.max\(1/);
  assert.match(page, /data-testid="phase4-combat-qa"/);
  assert.match(page, /qaCombatScenario\("A"\)/);
  assert.match(page, /qaCombatScenario\("B"\)/);
  assert.match(page, /qaCombatScenario\("C"\)/);
  assert.match(page, /qaCombatScenario\("D"\)/);
  assert.match(page, /game-assets\/effects\/sword-slash\.png/);
  assert.match(page, /game-assets\/effects\/bow-motion/);
  assert.match(page, /game-assets\/effects\/stars/);
  assert.match(page, /activeSfxRef\.current\.length>=8/);
  assert.match(page, /\{jobId:"SCOUT",cost:110/);
  assert.match(page, /SPEARMAN:\["spear",null\]/);
  assert.doesNotMatch(page, /SPEARMAN:\["spear","shield"\]/);
});

test("implements phase five as a single-state living-town simulation with three-day QA", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /type LifeState = "IDLE" \| "WALK" \| "GO_TO_WORK" \| "WORK" \| "CARRY" \| "SHOP" \| "EAT" \| "DRINK" \| "TALK" \| "WATCH" \| "PERFORM" \| "REST" \| "SLEEP" \| "EVACUATE" \| "RETURN_HOME"/);
  assert.match(page, /interface LifeTraits \{ workEthic:number; sociability:number; laziness:number; bravery:number; curiosity:number; alcoholPreference:number; musicPreference:number; shoppingPreference:number \}/);
  assert.match(page, /wakeMinute=6\*60\+38/);
  assert.match(page, /workStartMinute=7\*60\+48/);
  assert.match(page, /workEndMinute=17\*60\+35/);
  assert.match(page, /function chooseEvening/);
  assert.match(page, /function queueVisitors/);
  assert.match(page, /waiting\.length>=4/);
  assert.match(page, /function serveCustomer/);
  assert.match(page, /function beginConversation/);
  assert.match(page, /function beginPerformance/);
  assert.match(page, /function beginWatching/);
  assert.match(page, /const TOWN_EVENT_RULES:Record<TownEventType/);
  assert.match(page, /eventCooldowns:Partial<Record<TownEventType,number>>/);
  assert.match(page, /model\.eventCooldowns\[selected\]=model\.day\+TOWN_EVENT_RULES\[selected\]\.cooldown/);
  assert.match(page, /model\.lifeAudit\.combatPauses\+\+/);
  assert.match(page, /model\.lifeAudit\.combatResumes\+\+/);
  assert.match(page, /for\(let minute=0;minute<3\*1440;minute\+\+\)/);
  assert.match(page, /data-testid="phase5-life-qa"/);
  assert.match(page, /data-work-motion-violations=/);
  assert.match(page, /data-shopping-during-combat=/);
  assert.ok((page.match(/"small-house"/g) ?? []).length >= 3);
  assert.ok((page.match(/"large-house"/g) ?? []).length >= 3);
  assert.ok((page.match(/\["[a-z]+","[^"]+","[A-Z]+"/g) ?? []).length >= 30);
});

test("implements phase six with common hand sockets, supplied equipment, and stationary combat poses", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const EQUIPMENT_IMAGE_IDS:EquipmentId\[\]=/);
  assert.match(page, /mainHandSocket/);
  assert.match(page, /offHandSocket/);
  assert.match(page, /function drawTinyHeldAsset/);
  assert.match(page, /function bowMotionFrame/);
  assert.match(page, /function equipmentMirror/);
  assert.match(page, /const diagonal=-Math\.PI\*\.15/);
  assert.match(page, /reach=3\*pull-15\*thrust\+12\*recover/);
  assert.match(page, /mainGripX=mainHandX\+mainPose\.dx\*unit/);
  assert.match(page, /offGripX=offHandX\+offPose\.dx\*unit/);
  assert.match(page, /if\(id==="smith-hammer"\)return\[\.75,\.77\]/);
  assert.match(page, /const EQUIPMENT_QA_JOBS:JobId\[\]=/);
  assert.match(page, /data-testid="equipment-pose-qa"/);
  assert.match(page, /data-spear-angle=/);
  assert.match(page, /data-spear-shields=/);
  assert.match(page, /data-walk-actions=/);
  assert.match(page, /data-testid="phase6-combat-qa"/);
  assert.match(page, /type CharacterRigImages=\{body:HTMLCanvasElement/);
  assert.match(page, /READABLE_BODY_SOURCE_HEIGHT=28,READABLE_FOOT_SOURCE_HEIGHT=7/);
  assert.match(page, /function makeReadableCharacterSprite/);
  assert.match(page, /data\[i\+3\]<78/);
  assert.match(page, /const solid=new Uint8ClampedArray\(data\)/);
  assert.match(page, /stride=isArtillery\|\|isMounted\|\|climbing\?0:cycle\*1\.9\*unit/);
  assert.match(page, /bodyPoseX=artilleryRecoil\+\(state==="WORK"/);
  assert.match(page, /if\(state==="WORK"&&workLean>\.72\)/);
  assert.match(page, /const CHARACTER_RIG=\{bodyHeight:29/);
  assert.match(page, /data-readability-source=\{READABLE_BODY_SOURCE_HEIGHT\}/);
  assert.match(page, /data-moving-aim=/);
  assert.match(page, /data-attack-feet=/);
  assert.match(page, /phase6BowSequence==="1→2→3→4→5"/);
  assert.match(page, /const firingRange=clamp\(spec\.range-18/);
  assert.match(page, /allies:JobId\[\]=\["ARCHER","ARCHER","ARCHER","ARCHER","ARCHER","SOLDIER","SPEARMAN","SHIELDER"\]/);
  assert.match(page, /enemies:JobId\[\]=\["SOLDIER","SOLDIER","SPEARMAN","AXEMAN","SHIELDER"\]/);

  const equipmentFiles = [
    "sword.png", "pickaxe.png", "guitar.png", "farming.png", "smith-hammer.png", "axe.png",
    "pottery.png", "beer.png", "wood.png", "wood-hammer.png", "shield.png", "bread.png",
    "lantern.png", "spear.png", "book.png", "cross.png",
  ];
  await Promise.all(equipmentFiles.map((file) => access(new URL(`../public/game-assets/equipment/${file}`, import.meta.url))));
});

test("renders supplied transparent cutaway buildings in one long pixel street", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /function boxBuildingFloors/);
  assert.match(page, /const sprite=images\.buildings\[b\.kind\]/);
  assert.match(page, /ctx\.drawImage\(sprite,left,top,drawW,drawH\)/);
  assert.match(page, /CONSTRUCTIBLE_BUILDING_KINDS\.map/);
  assert.match(page, /saved\.buildings\.filter\(\(building\)=>CONSTRUCTIBLE_BUILDING_KINDS\.includes\(building\.kind\)\)/);
  assert.doesNotMatch(page, /void images;drawBoxModuleBuilding/);
  assert.match(page, /imageSmoothingEnabled=false/);
  assert.match(page, /if\(kind==="watchtower"\)return 4/);
  assert.match(page, /if\(kind==="townhall"\|\|kind==="chapel"\)return 3/);
  assert.match(page, /cursor\+=w\+54/);
  assert.match(page, /data-building-renderer="provided-cutaway-pixel"/);
  assert.match(page, /<img src=\{buildingAssetUrl\(kind\)\}/);
  assert.match(page, /<img src=\{buildingAssetUrl\(placing\)\}/);
  assert.match(page, /<img src=\{buildingAssetUrl\(selectedBuilding\.kind\)\}/);
  assert.match(css, /Fixed-screen micro pixel idle presentation/);
  assert.match(css, /font-family: "Courier New"/);

  const suppliedBuildingFiles = [
    "watchtower.png", "workshop.png", "farm.png", "smithy.png", "townhall.png", "carpentry.png",
    "logistics.png", "logging.png", "barracks.png", "hospital.png", "bakery.png", "market.png",
    "small-house.png", "restaurant.png", "sawmill.png", "tavern.png", "warehouse.png", "cafe.png", "large-house.png",
  ];
  await Promise.all(suppliedBuildingFiles.map((file) => access(new URL(`../public/game-assets/buildings/${file}`, import.meta.url))));
  const smallHousePng = await readFile(new URL("../public/game-assets/buildings/small-house.png", import.meta.url));
  assert.equal(smallHousePng.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(smallHousePng[25], 6, "small house must be a true RGBA PNG, not a baked checkerboard RGB image");
});

test("stacks only houses with supported offsets, functional ladders, and staged worker construction", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /type ConstructionState = "planned" \| "frame" \| "shell" \| "complete"/);
  assert.match(page, /function isHouseKind\(kind:BuildingKind\)/);
  assert.match(page, /function scheduleHouseStack/);
  assert.match(page, /function houseStackGeometry/);
  assert.match(page, /stackParentId\?:string/);
  assert.match(page, /g\.stackParentId/);
  assert.match(page, /scheduleHouseStack\(model,parent,g\.stackOffset\?\?0,g\.kind\)/);
  assert.match(page, /const pointerUp=[\s\S]*?if\(!current\|\|!placementArmed\)\{updateGhost\(e\.clientX,e\.clientY,true\)/);
  assert.match(page, /data-testid="placement-confirm"/);
  assert.match(page, /이 위치에 건설할까요\?/);
  assert.match(page, /!isHouseKind\(base\.kind\)/);
  assert.match(page, /groundY=base\.groundY-base\.h/);
  assert.match(page, /overlap>=Math\.min\(base\.w,w\)\*\.45/);
  assert.match(page, /ladderBottomY:parent\?\.groundY/);
  assert.match(page, /function drawPixelLadder/);
  assert.match(page, /kind\?:"road"\|"ladder"\|"floor"/);
  assert.match(page, /v\.mode=next\.kind==="ladder"/);
  assert.match(page, /function assignConstructionWorkers/);
  assert.match(page, /v\.jobId==="BUILDER"\|\|v\.jobId==="CARPENTER"/);
  assert.match(page, /function advanceConstructionWorker/);
  assert.match(page, /building\.materialsDelivered=Math\.min\(3/);
  assert.match(page, /constructionStateFor\(building\.constructionProgress\)/);
  assert.match(page, /"large-house":\[104,82\]/);
  assert.match(page, /"small-house":\[88,62\]/);
  assert.match(page, /\[previewW,previewH\]=buildingDimensions\(ghost\.kind\)/);
  assert.match(page, /\[w\]=buildingDimensions\(kind\)/);
  assert.match(page, /setBuildOpen\(false\);setPlacing\(kind\)/);
  assert.match(page, /if\(kind==="large-house"\)return 2/);
  assert.match(page, /revealH=Math\.max\(2,Math\.round\(drawH\*progress\)\)/);
  assert.match(page, /ctx\.rect\(left,ground-revealH,drawW,revealH\)/);
  assert.doesNotMatch(page, /if\(!buildingIsComplete\(b\)\)\{drawConstructionSite/);
  assert.match(page, /const PROVIDED_BUILDING_KINDS:BuildingKind\[\]=\["small-house"/);
  assert.match(page, /const CONSTRUCTIBLE_BUILDING_KINDS:BuildingKind\[\]=\[\.\.\.PROVIDED_BUILDING_KINDS\]/);
  assert.match(css, /\.game-shell\.qa-ui-closed \.phase1-qa-panel/);
  assert.match(css, /\.qa-panel\.closed > button:not\(\.qa-toggle\)/);
  assert.match(page, /const beginHouseExtension=/);
  assert.match(page, /onClick=\{\(\)=>beginHouseExtension\(selectedBuilding\.id\)\}/);
  assert.match(page, /function assignedSleepPoint/);
  assert.match(page, /function lockSleepingVillager/);
  assert.match(page, /v\.lifeState==="SLEEP"&&v\.mode==="sleep"&&!villagerMoving\(v\)/);
  assert.match(page, /function placeAtNavPoint/);
  assert.match(page, /data-testid="sleep-state-qa"/);
  assert.match(page, /data-moving-sleepers=/);
  assert.match(page, /data-awake-zzz=/);
  assert.match(page, /data-upper-sleepers=/);
});

test("adds exact two-frame mounted lancers with diagonal hand-held lances and fixed scale", async () => {
  const [page, auditText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/game-assets/cavalry/alpha-audit.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /\| "CAVALRY" \| "ARMORED_CAVALRY"/);
  assert.match(page, /CAVALRY:"기마병"/);
  assert.match(page, /ARMORED_CAVALRY:"갑옷 기마병"/);
  assert.match(page, /const MOUNTED_FRAME_URLS/);
  assert.match(page, /normal-run-1\.png/);
  assert.match(page, /armored-run-2\.png/);
  assert.match(page, /function drawMountedLance/);
  assert.match(page, /angle:-Math\.PI\*\.15/);
  assert.match(page, /mountedFrame=walking\?Math\.floor/);
  assert.match(page, /mountedBoost=isMountedJob\(v\.jobId\)\?1\.38:1/);
  assert.match(page, /if\(isMountedJob\(v\.jobId\)\)return\[null,null\]/);
  assert.match(page, /pushCombatEffect\(model,thrust\?"thrust":"slash"/);
  assert.match(page, /type:thrust\?"spear":"sword"/);

  const audit = JSON.parse(auditText);
  for (const part of Object.values(audit)) {
    assert.equal(part.borderAlpha, 0);
    assert.equal(part.partial, 0);
    assert.ok(part.transparent > 0);
  }
  await Promise.all([
    "normal-run-1.png", "normal-run-2.png", "armored-run-1.png", "armored-run-2.png", "lance.png",
  ].map((file) => access(new URL(`../public/game-assets/cavalry/${file}`, import.meta.url))));
});

test("adds four distributed civilian rigs and repeatable passenger balloons without changing job sprites", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /type CivilianVariant = "male-a" \| "male-b" \| "female-a" \| "female-b"/);
  assert.match(page, /type BalloonVariant = "male-a" \| "female-a" \| "male-b"/);
  assert.match(page, /const CIVILIAN_COUNT=24,CIVILIAN_ZONE_COUNT=6/);
  assert.match(page, /function createCivilianPopulation\(count=CIVILIAN_COUNT\)/);
  assert.match(page, /function spacedCivilianTarget/);
  assert.match(page, /function chooseCivilianActivity/);
  assert.match(page, /function updateCivilians/);
  assert.match(page, /if\(v\.isCivilian\)return\[null,null\]/);
  assert.match(page, /civilianRigs:Partial<Record<CivilianVariant,CharacterRigImages>>/);
  assert.match(page, /const BALLOON_FLIGHTS:BalloonFlight\[\]=Array\.from\(\{length:12\}/);
  assert.match(page, /function balloonFlightPoint/);
  assert.match(page, /function drawPixelBalloons/);
  assert.match(page, /ctx\.imageSmoothingEnabled=false;ctx\.drawImage\(image,-drawW\/2,-drawH,drawW,drawH\)/);
  assert.match(page, /data-testid="citizen-balloon-qa"/);
  assert.match(page, /data-testid="civilian-live-qa"/);
  assert.match(page, /data-left-walkers=/);
  assert.match(page, /data-right-walkers=/);
  assert.match(page, /data-stationary-foot-violations=/);
  assert.match(page, /data-rendered-balloons="8"/);
  assert.match(page, /data-reentry=/);
  assert.match(page, />시민·열기구<\/button>/);

  const civilianParts = ["body.png", "left-foot.png", "right-foot.png"];
  const civilianVariants = ["male-a", "male-b", "female-a", "female-b"];
  const balloonVariants = ["male-a.png", "female-a.png", "male-b.png"];
  const assetUrls = [
    ...civilianVariants.flatMap((variant) => civilianParts.map((part) => new URL(`../public/game-assets/civilians/${variant}/${part}`, import.meta.url))),
    ...balloonVariants.map((file) => new URL(`../public/game-assets/balloons/${file}`, import.meta.url)),
  ];
  const pngs = await Promise.all(assetUrls.map((url) => readFile(url)));
  for (const png of pngs) {
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(png[25], 6, "runtime citizen and balloon assets must be RGBA PNG files");
  }
});
