import './shim.js';
const H = await import('./house.mjs');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ' + name); pass++; }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); fail++; }
};
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m ?? 'expected truthy'); };

const reset = () => localStorage.clear();

const seedProfile = (over = {}) =>
  localStorage.setItem('gm_calendar_profile', JSON.stringify({
    treatyArea: null, province: null, hasChildren: false, isStudent: false,
    isEmployed: false, incomeExempt: false, isElder: false,
    bandDistributionMonths: [], customReminders: [], ...over,
  }));

const seedHousehold = (over = {}) =>
  localStorage.setItem('gm_household', JSON.stringify({
    adults: 1, children: [], province: null, hasStatus: null,
    elderInHousehold: false, yearsUnfiled: 0, updatedAt: '2026-08-25', ...over,
  }));

const kid = (birthYear) => ({ id: 'c1', birthYear });

console.log('\n— with no household, nothing changes —');

t('the profile reads exactly as it was stored', () => {
  reset();
  seedProfile({ hasChildren: true, province: 'British Columbia', isElder: true });
  const p = H.getProfile();
  eq(p.hasChildren, true);
  eq(p.province, 'British Columbia');
  eq(p.isElder, true);
  eq(H.householdAnswersFor(), []);
});

t('an untouched device knows nothing', () => {
  reset();
  eq(H.hasProfile(), false);
  eq(H.hasStoredProfile(), false);
});

console.log('\n— where they disagree, the household wins —');

t('a household with children overrules a profile that says none', () => {
  reset();
  seedProfile({ hasChildren: false });
  seedHousehold({ children: [kid(2020)] });
  eq(H.getProfile().hasChildren, true, 'the real list beats the unticked box:');
});

t('a household with no children overrules a profile that says there are', () => {
  reset();
  seedProfile({ hasChildren: true });
  seedHousehold({ children: [] });
  eq(H.getProfile().hasChildren, false, 'it resolves in both directions:');
});

t('the Elder answer resolves the same way', () => {
  reset();
  seedProfile({ isElder: true });
  seedHousehold({ elderInHousehold: false });
  eq(H.getProfile().isElder, false);
});

t('a province the household states replaces the profile’s', () => {
  reset();
  seedProfile({ province: 'Ontario' });
  seedHousehold({ province: 'British Columbia' });
  eq(H.getProfile().province, 'British Columbia');
});

console.log('\n— what the household has not been asked, it does not answer —');

t('an unstated province does not blank the one the calendar holds', () => {
  reset();
  seedProfile({ province: 'Ontario' });
  seedHousehold({ province: null });
  eq(H.getProfile().province, 'Ontario', 'unanswered is not "answered none":');
  ok(!H.householdAnswersFor().includes('province'), 'and the form may still ask it');
});

t('the household never touches fields it cannot answer', () => {
  reset();
  seedProfile({ isStudent: true, isEmployed: true, incomeExempt: true, treatyArea: 'Treaty 6' });
  seedHousehold({ children: [kid(2019)] });
  const p = H.getProfile();
  eq(p.isStudent, true);
  eq(p.isEmployed, true);
  eq(p.incomeExempt, true);
  eq(p.treatyArea, 'Treaty 6');
});

console.log('\n— the two questions hasProfile used to conflate —');

t('a household alone means the site knows something', () => {
  reset();
  seedHousehold({ children: [kid(2021)] });
  eq(H.hasProfile(), true, 'the forecast can read a profile:');
  eq(H.hasStoredProfile(), false, 'but she never opened the calendar:');
  eq(H.getProfile().hasChildren, true, 'and the CCB is no longer invisible:');
});

t('storedProfile stays her own answers, unoverlaid', () => {
  reset();
  seedProfile({ hasChildren: false });
  seedHousehold({ children: [kid(2018)] });
  eq(H.getProfile().hasChildren, true, 'the overlay applies on read:');
  eq(H.storedProfile().hasChildren, false, 'and never rewrites what she typed:');
});

t('saving the calendar form cannot launder the overlay into her answers', () => {
  reset();
  seedProfile({ hasChildren: false, isStudent: false });
  seedHousehold({ children: [kid(2018)] });
  // The form edits storedProfile() and saves that. Simulate it.
  const draft = { ...H.storedProfile(), isStudent: true };
  H.saveProfile(draft);
  eq(H.storedProfile().hasChildren, false, 'her answer is untouched:');
  eq(H.storedProfile().isStudent, true, 'her edit landed:');
  eq(H.getProfile().hasChildren, true, 'and the household still answers:');
});

console.log('\n— seeding a household from what is already known —');

t('the draft takes province and Elder from the calendar, never children', () => {
  reset();
  seedProfile({ province: 'Manitoba', isElder: true, hasChildren: true });
  const d = H.draftFromWhatIsKnown();
  eq(d.province, 'Manitoba');
  eq(d.elderInHousehold, true);
  eq(d.children, [], 'a flag cannot say how many or how old:');
});

t('the draft takes status from a saved Benefits Finder run', () => {
  reset();
  localStorage.setItem('gm-benefits-results', JSON.stringify({
    timestamp: '2026-08-01', answers: { hasStatus: 'yes', hasChildren: 'yes' },
  }));
  eq(H.draftFromWhatIsKnown().hasStatus, true);
});

t('the draft saves nothing', () => {
  reset();
  seedProfile({ province: 'Alberta' });
  H.draftFromWhatIsKnown();
  eq(localStorage.getItem('gm_household'), null, 'a form seeded is not a household stored:');
});

t('childrenLikely falls back only where no household has been built', () => {
  reset();
  seedProfile({ hasChildren: true });
  eq(H.childrenLikely(), true);
  reset();
  eq(H.childrenLikely(), false);
});

console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
