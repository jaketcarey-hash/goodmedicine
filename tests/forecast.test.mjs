import './shim.js';
const F = await import('./bundle.mjs');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ' + name); pass++; }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); fail++; }
};
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m ?? 'expected truthy'); };
const near = (a, b, m) => { if (Math.abs(a - b) > 0.01) throw new Error(`${m ?? ''} expected ~${b}, got ${a}`); };

const TODAY = new Date(2026, 7, 20); // Thursday 20 August 2026

const budget = (income = [], expenses = [], actuals = []) => ({
  id: 'b1', month: '2026-08', income, expenses, actuals,
});

console.log('\n— benefit series matching —');
t('exact and word-boundary aliases match', () => {
  eq(F.matchBenefitSeries('CCB'), 'ccb');
  eq(F.matchBenefitSeries('Canada Child Benefit'), 'ccb');
  eq(F.matchBenefitSeries('CCB payment'), 'ccb');
  eq(F.matchBenefitSeries('GST credit'), 'cgeb');
  eq(F.matchBenefitSeries('OAS'), 'oas_gis');
});
t('near-misses do not match', () => {
  eq(F.matchBenefitSeries('Succble'), null);
  eq(F.matchBenefitSeries('Employment'), null);
  eq(F.matchBenefitSeries('Band distribution'), null);
});

console.log('\n— the walk —');
t('biweekly pay keeps its Friday phase across eight weeks', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 500,
    budget: budget([{ id: 'i1', label: 'Job', amount: 900, frequency: 'biweekly', category: 'employment', anchorDate: '2026-08-14' }]),
  });
  const dates = f.weeks.flatMap((w) => w.events.map((e) => e.date));
  eq(dates, ['2026-08-28', '2026-09-11', '2026-09-25', '2026-10-09']);
  dates.forEach((d) => eq(new Date(d + 'T00:00').getDay(), 5, 'every occurrence is a Friday:'));
});

t('CCB lands on the CRA date, not the anchor day-of-month', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 0,
    budget: budget([{ id: 'i1', label: 'CCB', amount: 648, frequency: 'monthly', category: 'benefits', anchorDate: '2026-08-01' }]),
  });
  const dates = f.weeks.flatMap((w) => w.events.map((e) => e.date));
  // The window is Mon 17 Aug – Sun 11 Oct, so October's payment is outside it.
  eq(dates, ['2026-08-20', '2026-09-18']);
  ok(f.weeks.flatMap(w => w.events)[0].provenance.includes('published by'), 'carries CRA provenance');
});

t('irregular income is never placed, only reported', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 0,
    budget: budget([{ id: 'i1', label: 'Carving sales', amount: 400, frequency: 'irregular', category: 'other' }]),
  });
  eq(f.weeks.flatMap((w) => w.events).length, 0);
  eq(f.unplaced, [{ label: 'Carving sales', monthlyAmount: 400, reason: 'irregular' }]);
});

t('an unanchored expense stays out of the walk', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 0,
    budget: budget([], [{ id: 'e1', label: 'Groceries', amount: 500, frequency: 'monthly', category: 'food' }]),
  });
  eq(f.weeks.flatMap((w) => w.events).length, 0);
  eq(f.unplaced[0].reason, 'no-date');
});

console.log('\n— the running balance —');
t('shortfall: the tight week is found before it arrives', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 300,
    budget: budget(
      [{ id: 'i1', label: 'Job', amount: 700, frequency: 'biweekly', category: 'employment', anchorDate: '2026-08-14' }],
      [{ id: 'e1', label: 'Rent', amount: 1100, frequency: 'monthly', category: 'housing', anchorDate: '2026-08-01' }],
    ),
  });
  ok(f.firstTightWeek, 'a tight week exists');
  ok(f.firstTightWeek.closingBalance < 0, 'and it closes below zero');
  // Sept 1 rent falls in the week of Aug 31; balance by then: 300 + 700(Aug28) − 1100 = −100
  eq(f.firstTightWeek.label, 'Aug 31');
  near(f.firstTightWeek.closingBalance, -100);
});

t('no starting balance means no balance and no tight claim', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: null,
    budget: budget([{ id: 'i1', label: 'Job', amount: 700, frequency: 'biweekly', category: 'employment', anchorDate: '2026-08-14' }]),
  });
  eq(f.firstTightWeek, null);
  f.weeks.forEach((w) => { eq(w.closingBalance, null); eq(w.tight, null); });
  ok(f.weeks.some((w) => w.moneyIn > 0), 'but money still moves');
});

t('steady month: eight weeks, none tight', () => {
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 2000,
    budget: budget(
      [{ id: 'i1', label: 'Job', amount: 1400, frequency: 'biweekly', category: 'employment', anchorDate: '2026-08-14' }],
      [{ id: 'e1', label: 'Rent', amount: 900, frequency: 'monthly', category: 'housing', anchorDate: '2026-08-01' }],
    ),
  });
  eq(f.weeks.length, 8);
  eq(f.firstTightWeek, null);
  f.weeks.forEach((w) => ok(w.tight === false, 'no week tight'));
});

console.log('\n— the empty case —');
t('no budget produces eight honest empty weeks', () => {
  const f = F.buildForecast({ today: TODAY, profile: null, budget: null });
  eq(f.weeks.length, 8);
  eq(f.basisMonth, null);
  eq(f.weeks.flatMap((w) => w.events).length, 0);
  eq(f.recordInformed, false);
});

console.log('\n— profile-driven markers —');
t('distribution months mark weeks, with no amount invented', () => {
  const f = F.buildForecast({
    today: TODAY, startBalance: 0, budget: budget(),
    profile: { treatyArea: null, province: 'British Columbia', hasChildren: false, isStudent: false, isEmployed: true, incomeExempt: false, isElder: false, bandDistributionMonths: [10], customReminders: [] },
  });
  const marked = f.weeks.filter((w) => w.distributionMonth);
  ok(marked.length > 0, 'October weeks are marked');
  eq(marked.flatMap((w) => w.events).length, 0, 'and carry no fabricated money');
});

t('a likely benefit with nothing entered is reported, never estimated', () => {
  const f = F.buildForecast({
    today: TODAY, startBalance: 0, budget: budget(),
    profile: { treatyArea: null, province: 'British Columbia', hasChildren: true, isStudent: false, isEmployed: false, incomeExempt: false, isElder: false, bandDistributionMonths: [], customReminders: [] },
  });
  ok(f.unentered.some((u) => u.key === 'ccb'), 'CCB flagged as unentered');
  eq(f.weeks.flatMap((w) => w.events).length, 0, 'and no amount invented');
});

console.log('\n— the record corrects the plan —');
t('a complete recorded month scales the category and says so', () => {
  localStorage.clear();
  // July recorded: $700 of food against a $500 plan.
  F.saveBudget({ id: 'b0', month: '2026-07', income: [], expenses: [], actuals: [
    { id: 'a1', date: '2026-07-05', label: 'Groceries', amount: 350, kind: 'expense', category: 'food' },
    { id: 'a2', date: '2026-07-19', label: 'Groceries', amount: 350, kind: 'expense', category: 'food' },
  ]});
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 1000,
    budget: budget([], [{ id: 'e1', label: 'Groceries', amount: 500, frequency: 'monthly', category: 'food', anchorDate: '2026-08-05' }]),
  });
  eq(f.recordInformed, true);
  eq(f.corrections.length, 1);
  near(f.corrections[0].recorded, 700);
  near(f.corrections[0].planned, 500);
  const ev = f.weeks.flatMap((w) => w.events)[0];
  near(Math.abs(ev.amount), 700, 'the event uses the recorded average:');
  ok(ev.provenance.includes('actually spend'), 'and says it was adjusted');
  localStorage.clear();
});

t('the month in progress does not count as a recorded month', () => {
  localStorage.clear();
  F.saveBudget({ id: 'b0', month: '2026-08', income: [], expenses: [], actuals: [
    { id: 'a1', date: '2026-08-05', label: 'Groceries', amount: 120, kind: 'expense', category: 'food' },
  ]});
  eq(F.averageRecordedSpending(TODAY), null, 'August is still running');
  localStorage.clear();
});

t('a gap under 10% is left alone', () => {
  localStorage.clear();
  F.saveBudget({ id: 'b0', month: '2026-07', income: [], expenses: [], actuals: [
    { id: 'a1', date: '2026-07-05', label: 'Groceries', amount: 520, kind: 'expense', category: 'food' },
  ]});
  const f = F.buildForecast({
    today: TODAY, profile: null, startBalance: 1000,
    budget: budget([], [{ id: 'e1', label: 'Groceries', amount: 500, frequency: 'monthly', category: 'food', anchorDate: '2026-08-05' }]),
  });
  eq(f.corrections.length, 0);
  eq(f.recordInformed, false);
  localStorage.clear();
});

t('actuals are not copied forward with the plan', () => {
  localStorage.clear();
  F.saveBudget({ id: 'b0', month: '2026-07', income: [], expenses: [{ id: 'e1', label: 'Rent', amount: 900, category: 'housing' }], actuals: [
    { id: 'a1', date: '2026-07-05', label: 'Groceries', amount: 200, kind: 'expense', category: 'food' },
  ]});
  const copied = F.copyBudgetToMonth('2026-07', '2026-09');
  eq(copied.expenses.length, 1, 'the plan carries');
  eq(copied.actuals, undefined, 'the record does not');
  localStorage.clear();
});

console.log('\n— when the published schedule runs out —');

const cgebBudget = {
  id: 'b9', month: '2026-09', actuals: [],
  income: [{ id: 'i1', label: 'CGEB', amount: 679, frequency: 'monthly', category: 'benefits', anchorDate: '2026-09-05' }],
  expenses: [{ id: 'e1', label: 'Rent', amount: 600, frequency: 'monthly', category: 'housing', anchorDate: '2026-09-01' }],
};

t('a series with no dates left is reported, not silently dropped', () => {
  // Past the end of every published 2026 schedule.
  const f = F.buildForecast({
    today: new Date(2027, 2, 1), profile: null, startBalance: 500, budget: cgebBudget,
  });
  const ended = f.unplaced.filter((u) => u.reason === 'schedule-ended');
  eq(ended.length, 1, 'it lands in unplaced:');
  eq(ended[0].label, 'CGEB');
  ok(ended[0].monthlyAmount > 0, 'and carries what it is worth a month');
});

t('a quarterly benefit with no payment this window is not a false alarm', () => {
  // 20 Aug 2026: CGEB's next payment is 5 October, outside the eight weeks
  // from a mid-August start only if the window ends before it — so pick a
  // window that genuinely contains none while dates remain in the future.
  const f = F.buildForecast({
    today: new Date(2026, 6, 6), profile: null, startBalance: 500, budget: cgebBudget,
  });
  const ended = f.unplaced.filter((u) => u.reason === 'schedule-ended');
  eq(ended.length, 0, 'dates still exist ahead, so nothing has ended:');
});

t('the balance does not quietly lose an entered benefit', () => {
  const during = F.buildForecast({
    today: new Date(2026, 8, 15), profile: null, startBalance: 500, budget: cgebBudget,
  });
  const after = F.buildForecast({
    today: new Date(2027, 2, 1), profile: null, startBalance: 500, budget: cgebBudget,
  });
  ok(during.weeks.flatMap((w) => w.events).some((e) => /CGEB/.test(e.label)),
     'while dates exist the payment is on the strip');
  // After the schedule ends the money is genuinely not placeable, but the
  // forecast must now say so rather than let the balance drop in silence.
  ok(after.unplaced.some((u) => u.reason === 'schedule-ended'),
     'and once they run out the surface can report it');
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
