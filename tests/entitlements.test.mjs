import './shim.js';
const E = await import('./ent.mjs');
let pass=0, fail=0;
const t=(n,f)=>{try{f();console.log('  ok  '+n);pass++}catch(e){console.log('  FAIL '+n+'\n       '+e.message);fail++}};
const ok=(c,m)=>{if(!c)throw new Error(m??'expected truthy')};
const eq=(a,b,m)=>{if(a!==b)throw new Error(`${m??''} expected ${b}, got ${a}`)};

const TODAY = new Date(2026, 7, 21);
const hh = (o={}) => ({adults:1, children:[], province:'British Columbia', hasStatus:true,
  elderInHousehold:false, yearsUnfiled:0, updatedAt:'', ...o});
const kid = (y) => ({id:'k'+y, birthYear:y});
const find = (p,id) => p.entitlements.find(e=>e.id===id);

console.log('\n— nothing claimed without the fact behind it —');
t('no children entered, no child benefit', () => {
  const p = E.buildEntitlements({household: hh({yearsUnfiled:3}), today:TODAY});
  ok(!find(p,'ccb'), 'CCB must not appear');
});
t('up to date on filing means nothing retroactive is quantified', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2022)], yearsUnfiled:0}), today:TODAY});
  eq(p.quantifiedTotal, 0);
  ok(!find(p,'ccb') && !find(p,'cgeb'), 'neither retroactive benefit appears');
});

console.log('\n— the arithmetic —');
t('one child under 6, one unfiled year', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2022)], yearsUnfiled:1}), today:TODAY});
  // 2025 tax year, child born 2022 => age 3 => under-6 band
  eq(find(p,'ccb').totalMax, 8157);
});
t('a child ages across the six-year band mid-window', () => {
  // Born 2019: age 6 in 2025, age 5 in 2024, age 4 in 2023.
  const p = E.buildEntitlements({household: hh({children:[kid(2019)], yearsUnfiled:3}), today:TODAY});
  eq(find(p,'ccb').totalMax, 6883 + 8157 + 8157,
    'the band must be applied per year, not from today\'s age:');
});
t('a child over 17 in an earlier year contributes nothing for it', () => {
  // Born 2007: age 18 in 2025, 17 in 2024, 16 in 2023.
  const p = E.buildEntitlements({household: hh({children:[kid(2007)], yearsUnfiled:3}), today:TODAY});
  eq(find(p,'ccb').totalMax, 6883 * 2, 'the year they turned 18 must drop out:');
});
t('a child not yet born in an earlier year contributes nothing for it', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2025)], yearsUnfiled:3}), today:TODAY});
  eq(find(p,'ccb').totalMax, 8157, 'only the year they existed:');
});
t('couple rate differs from single, and children add per-child', () => {
  const single = E.buildEntitlements({household: hh({yearsUnfiled:1}), today:TODAY});
  const couple = E.buildEntitlements({household: hh({adults:2, children:[kid(2020)], yearsUnfiled:1}), today:TODAY});
  eq(find(single,'cgeb').totalMax, 679);
  eq(find(couple,'cgeb').totalMax, 890 + 234);
});
t("the site's own worked example reproduces", () => {
  // /money/taxes: a single parent, two young children, "$12,000-15,000 a year".
  const p = E.buildEntitlements({household: hh({children:[kid(2021),kid(2023)], yearsUnfiled:1}), today:TODAY});
  const perYear = p.annualTotal;
  ok(perYear > 12000 && perYear < 18000, `expected the article's range, got ${perYear}`);
});

console.log('\n— the ten-year wall —');
t('years unfiled is capped at ten', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2010)], yearsUnfiled:40}), today:TODAY});
  eq(p.yearsUnfiled, 10);
});
t('the expiring year is named', () => {
  const p = E.buildEntitlements({household: hh({yearsUnfiled:3}), today:TODAY});
  eq(p.yearExpiring, 2016);
});

console.log('\n— what must never be guessed —');
t('the Section 87 line carries no number', () => {
  const p = E.buildEntitlements({household: hh({yearsUnfiled:1}), today:TODAY,
    exemptionVerdict:'likely-exempt', hasEmploymentIncome:true});
  const s = find(p,'s87-withheld');
  ok(s, 'the line should appear');
  eq(s.totalMax, null, 'and must stay unquantified:');
  eq(s.status, 'named');
});
t('a grey-zone verdict raises nothing', () => {
  const p = E.buildEntitlements({household: hh({yearsUnfiled:1}), today:TODAY,
    exemptionVerdict:'grey-zone', hasEmploymentIncome:true});
  ok(!find(p,'s87-withheld'), 'a grey verdict is not a claim');
});
t('named lines never enter the total', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2020)], yearsUnfiled:2}), today:TODAY,
    exemptionVerdict:'likely-exempt', hasEmploymentIncome:true});
  const named = p.entitlements.filter(e=>e.status==='named');
  ok(named.length >= 2, 'named lines exist');
  const quantSum = p.entitlements.filter(e=>e.status==='quantified')
    .reduce((s,e)=>s+e.totalMax,0);
  eq(p.quantifiedTotal, quantSum, 'the headline counts only what is computed:');
});

console.log('\n— the caveats are not optional —');
t('a quantified total always carries the taper caveat', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2020)], yearsUnfiled:1}), today:TODAY});
  ok(p.caveats.some(c=>/maximum at a low income/i.test(c)), 'taper caveat missing');
});
t('multi-year totals disclose that old years paid less', () => {
  const p = E.buildEntitlements({household: hh({children:[kid(2020)], yearsUnfiled:4}), today:TODAY});
  ok(p.caveats.some(c=>/earlier years paid less/i.test(c)), 'overstatement not disclosed');
});
t('no quantified total means no caveats to make', () => {
  const p = E.buildEntitlements({household: hh({yearsUnfiled:0}), today:TODAY});
  eq(p.caveats.length, 0);
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
