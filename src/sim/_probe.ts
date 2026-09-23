import { playRun } from '@/sim/driver';
for (let seed = 1; seed <= 12; seed++) {
  const r = playRun({ seed, bot: { kind: 'smart', archetype: 'auto' } });
  const s = r.finalState;
  console.log(
    seed,
    r.won ? 'WIN ' : 'lost',
    'm' + r.monthReached,
    'mon',
    s.mon,
    'charms',
    s.omamori.map((m) => m.id).join(','),
    '| poems',
    JSON.stringify(s.poems),
    '| ofuda',
    s.ofuda.join(','),
    '| enh',
    Object.keys(s.enhancements).length,
    '| stats',
    s.stats.charmsBought,
  );
}
