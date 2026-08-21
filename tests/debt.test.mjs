import './shim.js';
const D = await import('./debt.mjs');
let pass=0, fail=0;
const t=(n,f)=>{try{f();console.log('  ok  '+n);pass++}catch(e){console.log('  FAIL '+n+'\n       '+e.message);fail++}};
const ok=(c,m)=>{if(!c)throw new Error(m??'expected truthy')};
const near=(a,b,tol,m)=>{if(Math.abs(a-b)>tol)throw new Error(`${m??''} expected ~${b}, got ${a}`)};

const plan = {
  debts:[
    {id:'card', name:'Credit card', balance:6000, interestRate:22.9, minimumPayment:150},
    {id:'loan', name:'Family loan', balance:800, interestRate:4, minimumPayment:40},
  ],
  extraMonthly:0, strategy:'avalanche',
};
const totalInterest = D.calculateTotalInterest;

console.log('\n— one-time lump —');
t('a lump shortens the timeline and cuts interest', () => {
  const base = D.calculatePayoff(plan);
  const withLump = D.calculatePayoff(plan, {amount:2000});
  ok(withLump.length < base.length, 'fewer months');
  ok(totalInterest(withLump) < totalInterest(base), 'less interest');
});

t('a lump is NOT the same as the equivalent monthly extra', () => {
  const lump = D.calculatePayoff(plan, {amount:2400});
  const monthly = D.calculatePayoff({...plan, extraMonthly:200});
  ok(monthly.length < lump.length,
     'treating a one-off as recurring would overstate the payoff');
});

t('the lump goes to the strategy target by default', () => {
  // Avalanche targets the 22.9% card, not the 4% loan.
  const r = D.calculatePayoff(plan, {amount:1000});
  const firstMonth = r[0];
  ok(firstMonth.balances['loan'] > 700, 'the low-rate loan is untouched by the lump');
  ok(firstMonth.balances['card'] < 5100, 'the high-rate card took it');
});

t('an explicit debtId overrides the strategy', () => {
  const r = D.calculatePayoff(plan, {amount:500, debtId:'loan'});
  ok(r[0].balances['loan'] < 320, 'the named debt took it');
});

t('a lump larger than the named debt spills to the next target', () => {
  const r = D.calculatePayoff(plan, {amount:3000, debtId:'loan'});
  ok(r[0].balances['loan'] === 0, 'named debt cleared');
  ok(r[0].balances['card'] < 4000, 'remainder went to the card, not lost');
});

t('a lump clearing everything ends it immediately', () => {
  const r = D.calculatePayoff(plan, {amount:10000});
  ok(r.length <= 1, 'no long tail');
});

t('no lump behaves exactly as before', () => {
  const a = JSON.stringify(D.calculatePayoff(plan));
  const b = JSON.stringify(D.calculatePayoff(plan, undefined));
  ok(a===b, 'undefined lump is a no-op');
  const c = JSON.stringify(D.calculatePayoff(plan, {amount:0}));
  ok(a===c, 'zero lump is a no-op');
});

t('a lump never accrues a month of interest first', () => {
  // Paying the card to zero on day one means the card contributes no interest.
  const r = D.calculatePayoff({...plan, debts:[plan.debts[0]]}, {amount:6000});
  near(totalInterest(r), 0, 0.02, 'interest on a same-day full payoff:');
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
