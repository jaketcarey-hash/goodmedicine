import './shim.js';
const M = await import('./picture.mjs');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ' + name); pass++; }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); fail++; }
};
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m ?? 'expected truthy'); };

const TODAY = new Date(2026, 7, 20); // Thursday 20 August 2026

const reset = () => localStorage.clear();
const seedBudget = (income = [], expenses = []) =>
  localStorage.setItem('gm_budgets', JSON.stringify([
    { id: 'b1', month: '2026-08', income, expenses, actuals: [] },
  ]));
const seedBalance = (amount, recordedOn) =>
  localStorage.setItem('gm_forecast_balance', JSON.stringify({ amount, recordedOn }));

const seedProfile = (over = {}) =>
  localStorage.setItem('gm_calendar_profile', JSON.stringify({
    treatyArea: null, province: 'BC', hasChildren: false, isStudent: false,
    isEmployed: true, incomeExempt: false, isElder: false,
    bandDistributionMonths: [], customReminders: [], ...over,
  }));

const pay = (amount, anchorDate = '2026-08-21') =>
  ({ id: 'i1', label: 'Job', amount, frequency: 'biweekly', category: 'employment', anchorDate });
const rent = (amount, anchorDate = '2026-09-01') =>
  ({ id: 'e1', label: 'Rent', amount, frequency: 'monthly', category: 'housing', anchorDate });

const picture = () => M.getMoneyPicture({ today: TODAY });
const stepIds = () => M.suggestNextSteps(picture()).map((s) => s.id);

console.log('\n— the forecast reaches the picture —');

t('nothing entered means no forecast at all, not an empty one', () => {
  reset();
  eq(picture().forecast, null);
});

t('a budget with no balance walks, but judges nothing', () => {
  reset();
  seedBudget([pay(900)], [rent(1200)]);
  const f = picture().forecast;
  ok(f, 'forecast present');
  eq(f.hasBalance, false);
  eq(f.firstTightWeek, null, 'nothing to judge:');
  eq(f.balanceAgeDays, null);
  eq(f.basisMonth, '2026-08');
});

t('a balance that runs out names the week', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  seedBalance(200, '2026-08-20');
  const f = picture().forecast;
  eq(f.hasBalance, true);
  ok(f.firstTightWeek, 'a tight week was found');
  ok(f.firstTightWeek.closingBalance < 0, 'the named week closes below zero');
  ok(/^\w{3} \d+/.test(f.firstTightWeek.label), 'the week carries its Monday label');
});

t('a balance that holds says so, and is not confused with silence', () => {
  reset();
  seedBudget([pay(4000)], [rent(300)]);
  seedBalance(50_000, '2026-08-20');
  const f = picture().forecast;
  eq(f.hasBalance, true, 'there is a balance to judge:');
  eq(f.firstTightWeek, null, 'and no week goes short:');
  // The pair is the whole point: null alone cannot tell these two apart.
  reset();
  seedBudget([pay(4000)], [rent(300)]);
  const blind = picture().forecast;
  eq(blind.firstTightWeek, null);
  eq(blind.hasBalance, false, 'same null, different meaning:');
});

t('a week-old balance is used and flagged', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  seedBalance(200, '2026-08-01'); // 19 days before TODAY
  const f = picture().forecast;
  eq(f.balanceAgeDays, 19);
  eq(f.balanceStale, true);
});

t('a balance entered today is not stale', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  seedBalance(200, '2026-08-20');
  eq(picture().forecast.balanceStale, false);
});

console.log('\n— what the picture suggests —');

t('a tight week outranks every other step', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  seedBalance(200, '2026-08-20');
  eq(stepIds()[0], 'tight-week', 'a dated shortfall leads:');
});

t('the tight-week step names the balance it rests on', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  seedBalance(200, '2026-08-20');
  const step = M.suggestNextSteps(picture()).find((s) => s.id === 'tight-week');
  ok(/closes about/.test(step.why), 'it states the amount');
  ok(!/should/.test(step.why), 'it does not advise');
});

t('a stale balance is admitted inside the step, not hidden', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  seedBalance(200, '2026-08-01');
  const step = M.suggestNextSteps(picture()).find((s) => s.id === 'tight-week');
  ok(/19 days ago/.test(step.why), 'the age of the balance is in the sentence');
});

t('no balance asks for one instead of calling a week tight', () => {
  reset();
  seedBudget([pay(400)], [rent(1500)]);
  const ids = stepIds();
  ok(ids.includes('forecast-balance'), 'it asks');
  ok(!ids.includes('tight-week'), 'and claims nothing');
});

t('a holding balance produces neither step', () => {
  reset();
  seedBudget([pay(4000)], [rent(300)]);
  seedBalance(50_000, '2026-08-20');
  const ids = stepIds();
  ok(!ids.includes('tight-week'));
  ok(!ids.includes('forecast-balance'), 'nothing to ask for:');
});

t('a series with dates and no amount is named, never estimated', () => {
  reset();
  seedBudget([pay(900)], [rent(1200)]);
  seedProfile({ hasChildren: true });
  const step = M.suggestNextSteps(picture()).find((s) => s.id === 'unentered-benefit');
  ok(step, 'the step fires');
  ok(/not on this device/.test(step.why), 'it says why the walk is blind');
  ok(!/\$/.test(step.why), 'and puts no dollar figure on money it cannot know');
});

t('a single unentered series reads as one thing, not a list', () => {
  reset();
  seedBudget([pay(900)], [rent(1200)]);
  seedProfile(); // no children, no elder — CGEB alone
  const f = picture().forecast;
  eq(f.unentered.length, 1, 'one series:');
  const step = M.suggestNextSteps(picture()).find((s) => s.id === 'unentered-benefit');
  eq(step.title, 'The forecast cannot see your ' + f.unentered[0].label,
     'a lone series is named outright rather than called "benefit payments":');
  ok(/pays on published dates/.test(step.why), 'singular verb');
});

t('an entered benefit stops being unentered', () => {
  reset();
  seedProfile({ hasChildren: true });
  seedBudget(
    [pay(900), { id: 'i2', label: 'CCB', amount: 648, frequency: 'monthly', category: 'benefits', anchorDate: '2026-08-20' }],
    [rent(1200)],
  );
  const keys = picture().forecast.unentered.map((u) => u.key);
  ok(!keys.includes('ccb'), 'CCB is entered, so the walk can see it');
});

t('an empty site suggests a budget and nothing about forecasts', () => {
  reset();
  const ids = stepIds();
  ok(ids.includes('first-budget'));
  ok(!ids.includes('tight-week'));
  ok(!ids.includes('forecast-balance'), 'no forecast means no forecast advice:');
  ok(!ids.includes('unentered-benefit'));
});

console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
