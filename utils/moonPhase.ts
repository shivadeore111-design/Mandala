export function getMoonPhase(date: Date = new Date()) {
  const LUNAR_CYCLE = 29.53058770576;
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const currentAge = ((days % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const illumination = (1 - Math.cos((2 * Math.PI * currentAge) / LUNAR_CYCLE)) / 2;
  const daysUntilFull = currentAge <= LUNAR_CYCLE / 2
    ? LUNAR_CYCLE / 2 - currentAge
    : LUNAR_CYCLE - currentAge + LUNAR_CYCLE / 2;
  const daysUntilNew = LUNAR_CYCLE - currentAge;

  let phase: string, emoji: string;
  if (currentAge < 1.85)       { phase = 'New Moon';        emoji = '🌑'; }
  else if (currentAge < 5.53)  { phase = 'Waxing Crescent'; emoji = '🌒'; }
  else if (currentAge < 9.22)  { phase = 'First Quarter';   emoji = '🌓'; }
  else if (currentAge < 12.91) { phase = 'Waxing Gibbous';  emoji = '🌔'; }
  else if (currentAge < 16.61) { phase = 'Full Moon';       emoji = '🌕'; }
  else if (currentAge < 20.30) { phase = 'Waning Gibbous';  emoji = '🌖'; }
  else if (currentAge < 23.99) { phase = 'Last Quarter';    emoji = '🌗'; }
  else if (currentAge < 27.68) { phase = 'Waning Crescent'; emoji = '🌘'; }
  else                          { phase = 'New Moon';        emoji = '🌑'; }

  return {
    phase, emoji,
    illumination: Math.round(illumination * 100),
    daysUntilFull: Math.round(daysUntilFull),
    daysUntilNew: Math.round(daysUntilNew),
  };
}
