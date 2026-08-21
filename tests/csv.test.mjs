import './shim.js';
const C = await import('./csv.mjs');
let pass=0, fail=0;
const t=(n,f)=>{try{f();console.log('  ok  '+n);pass++}catch(e){console.log('  FAIL '+n+'\n       '+e.message);fail++}};
const eq=(a,b,m)=>{if(a!==b)throw new Error(`${m??''}\n       expected ${JSON.stringify(b)}\n       got      ${JSON.stringify(a)}`)};

console.log('\n— quoting —');
t('plain values pass through', () => eq(C.toCsv([['Rent',900]]), 'Rent,900'));
t('a comma forces quotes', () => eq(C.toCsv([['rent, hydro',900]]), '"rent, hydro",900'));
t('inner quotes are doubled', () => eq(C.toCsv([['the "big" bill',1]]), '"the ""big"" bill",1'));
t('newlines are contained', () => eq(C.toCsv([['two\nlines',1]]), '"two\nlines",1'));
t('null and undefined are empty, not the word', () => eq(C.toCsv([[null,undefined,'x']]), ',,x'));
t('rows join with CRLF for Excel', () => eq(C.toCsv([['a'],['b']]), 'a\r\nb'));

console.log('\n— formula injection (labels are user-typed) —');
for (const [bad, why] of [['=1+1','equals'],['+1','plus'],['-1','minus'],['@SUM(A1)','at']]) {
  t(`a leading ${why} is defused`, () => {
    const out = C.toCsv([[bad]]);
    if (!out.includes("'" + bad)) throw new Error('not prefixed: ' + out);
  });
}
t('the classic command payload cannot execute', () => {
  const payload = '=cmd|\' /C calc\'!A0';
  const out = C.toCsv([[payload]]);
  if (!out.startsWith('"\'=cmd')) throw new Error('unexpected: ' + out.slice(0,30));
});
t('a legitimate minus in a NUMBER is untouched', () => eq(C.toCsv([[-450]]), '-450',
  'negative amounts must stay numeric or the spreadsheet cannot sum them:'));
t('a hyphenated word is untouched', () => eq(C.toCsv([['co-op fees']]), 'co-op fees'));

console.log('\n— filenames —');
t('stamp sorts', () => eq(C.stamp(new Date(2026,7,5)), '2026-08-05'));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
