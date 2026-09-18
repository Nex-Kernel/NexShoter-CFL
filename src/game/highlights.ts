import { MatchHighlight, PlayTimelineStep, PlayerCombatEvent, WeaponId } from '../types';

/**
 * Format match seconds into MM:SS format
 */
export function formatMatchTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface RawPlayCandidate {
  category: MatchHighlight['category'];
  title: string;
  badge: string;
  badgeColor: string;
  score: number;
  killsCount: number;
  damageDealt: number;
  headshotsCount: number;
  weaponName: string;
  weaponId?: WeaponId;
  streakCount: number;
  startSec: number;
  endSec: number;
  victims: string[];
  description: string;
  timeline: PlayTimelineStep[];
}

export function generateMatchHighlights(
  events: PlayerCombatEvent[],
  finalKills: number,
  bestStreak: number,
  primaryWeaponName: string,
  primaryWeaponId: WeaponId = 'scar',
  fallbackBotNames: string[] = ['ShadowViper', 'GhostProtocol', 'ApexStriker', 'NovaUnit', 'CyberRaven']
): MatchHighlight[] {
  const candidates: RawPlayCandidate[] = [];

  // Filter player kill events and hit events
  const killEvents = events.filter((e) => e.type === 'kill');

  // 1. Multi-Kill Detection (Clusters within 7-8s window)
  if (killEvents.length >= 2) {
    for (let i = 0; i < killEvents.length; i++) {
      const cluster: PlayerCombatEvent[] = [killEvents[i]];
      for (let j = i + 1; j < killEvents.length; j++) {
        const timeDiff = killEvents[j].matchElapsedSec - cluster[cluster.length - 1].matchElapsedSec;
        if (timeDiff <= 7.5 && cluster.length < 5) {
          cluster.push(killEvents[j]);
        } else {
          break;
        }
      }

      if (cluster.length >= 2) {
        const startSec = Math.max(0, cluster[0].matchElapsedSec - 1.5);
        const endSec = cluster[cluster.length - 1].matchElapsedSec + 0.5;
        const duration = Math.max(1, endSec - startSec);

        // Find all hit/kill events within this time window
        const windowEvents = events.filter(
          (e) => e.matchElapsedSec >= startSec && e.matchElapsedSec <= endSec
        );

        const killsCount = cluster.length;
        const damageDealt = windowEvents.reduce((sum, e) => sum + e.damage, 0) || killsCount * 100;
        const headshotsCount = cluster.filter((e) => e.isHeadshot).length;
        const maxStreak = Math.max(...cluster.map((e) => e.streak), killsCount);
        const victims = Array.from(new Set(cluster.map((e) => e.victim)));
        const weapon = cluster[cluster.length - 1].weapon || primaryWeaponName;

        let title = 'Double Kill Burst';
        let badge = 'DOUBLE KILL';
        let badgeColor = 'emerald';
        let category: MatchHighlight['category'] = 'multi_kill';

        if (killsCount >= 4) {
          title = 'Overkill Frenzy';
          badge = 'QUAD KILL';
          badgeColor = 'purple';
        } else if (killsCount === 3) {
          title = 'Triple Kill Sweep';
          badge = 'TRIPLE KILL';
          badgeColor = 'amber';
        } else if (headshotsCount === 2) {
          title = 'Precision Double Strike';
          badge = 'HEADSHOT COMBO';
          badgeColor = 'cyan';
          category = 'headshot_spree';
        }

        const score = Math.round(
          killsCount * 420 +
          damageDealt * 1.6 +
          headshotsCount * 220 +
          Math.max(0, (10 - duration) * 35) +
          maxStreak * 120
        );

        // Build chronological timeline steps
        const timeline: PlayTimelineStep[] = [];
        windowEvents.forEach((ev) => {
          const offset = Math.max(0, parseFloat((ev.matchElapsedSec - startSec).toFixed(1)));
          if (ev.type === 'kill') {
            timeline.push({
              offsetSec: offset,
              type: ev.isHeadshot ? 'headshot_kill' : 'kill',
              description: ev.isHeadshot
                ? `Critical headshot elimination on ${ev.victim} (${ev.damage} DMG)`
                : `Eliminated ${ev.victim} with ${ev.weapon}`,
              damage: ev.damage,
              target: ev.victim,
              weapon: ev.weapon,
              badge: ev.isHeadshot ? 'CRIT ELIMINATION' : 'FRAG CONFIRMED'
            });
          } else if (ev.damage > 20) {
            timeline.push({
              offsetSec: offset,
              type: 'hit',
              description: `Heavy armor strike on ${ev.victim} (-${ev.damage} HP)`,
              damage: ev.damage,
              target: ev.victim,
              weapon: ev.weapon
            });
          }
        });

        candidates.push({
          category,
          title,
          badge,
          badgeColor,
          score,
          killsCount,
          damageDealt,
          headshotsCount,
          weaponName: weapon,
          weaponId: cluster[0].weaponId || primaryWeaponId,
          streakCount: maxStreak,
          startSec,
          endSec,
          victims,
          description: `Eliminated ${killsCount} combatants in ${duration.toFixed(1)}s dealing ${damageDealt} total damage.`,
          timeline: timeline.length > 0 ? timeline : [
            { offsetSec: 0.0, type: 'hit', description: `Engaged combatants with ${weapon}`, damage: 50 },
            { offsetSec: 1.2, type: 'kill', description: `Eliminated ${victims[0] || 'Opponent'}`, damage: 100 }
          ]
        });
      }
    }
  }

  // 2. High-Damage Streaks & Rampages (Windows of high damage or 3+ killstreaks)
  if (events.length > 0) {
    const windowSec = 14;
    for (let i = 0; i < events.length; i += 3) {
      const windowStart = events[i].matchElapsedSec;
      const windowEnd = windowStart + windowSec;
      const slice = events.filter((e) => e.matchElapsedSec >= windowStart && e.matchElapsedSec <= windowEnd);
      const sliceKills = slice.filter((e) => e.type === 'kill');
      const sliceDamage = slice.reduce((sum, e) => sum + e.damage, 0);
      const headshots = slice.filter((e) => e.isHeadshot).length;
      const highestStreak = Math.max(0, ...slice.map((e) => e.streak));

      if (sliceDamage >= 160 || sliceKills.length >= 2 || highestStreak >= 3) {
        const victims = Array.from(new Set(sliceKills.map((e) => e.victim)));
        const score = Math.round(sliceDamage * 2.2 + sliceKills.length * 280 + highestStreak * 160 + headshots * 180);

        let title = 'High Damage Assault';
        let badge = `+${sliceDamage} DAMAGE`;
        let badgeColor = 'rose';
        let category: MatchHighlight['category'] = 'high_damage';

        if (highestStreak >= 5) {
          title = 'Unstoppable Rampage';
          badge = `${highestStreak}x RAMPAGE`;
          badgeColor = 'amber';
          category = 'killstreak';
        } else if (highestStreak >= 3) {
          title = 'Combat Dominance';
          badge = `${highestStreak}x STREAK`;
          badgeColor = 'cyan';
          category = 'killstreak';
        }

        const timeline: PlayTimelineStep[] = slice.map((ev) => ({
          offsetSec: Math.max(0, parseFloat((ev.matchElapsedSec - windowStart).toFixed(1))),
          type: ev.type === 'kill' ? (ev.isHeadshot ? 'headshot_kill' : 'kill') : 'hit',
          description: ev.type === 'kill'
            ? `Eliminated ${ev.victim} (${ev.damage} DMG)`
            : `Suppressive fire on ${ev.victim} (-${ev.damage} HP)`,
          damage: ev.damage,
          target: ev.victim,
          weapon: ev.weapon,
          badge: ev.type === 'kill' ? 'CONFIRMED FRAG' : undefined
        }));

        candidates.push({
          category,
          title,
          badge,
          badgeColor,
          score,
          killsCount: sliceKills.length,
          damageDealt: sliceDamage,
          headshotsCount: headshots,
          weaponName: slice[0]?.weapon || primaryWeaponName,
          weaponId: slice[0]?.weaponId || primaryWeaponId,
          streakCount: highestStreak,
          startSec: windowStart,
          endSec: windowEnd,
          victims: victims.length > 0 ? victims : [fallbackBotNames[0]],
          description: `Inflicted massive suppressive damage (${sliceDamage} DMG) across hostile sector.`,
          timeline
        });
      }
    }
  }

  // 3. Precision Headshots / Slide Kills (Individual standout plays)
  const specialKills = killEvents.filter((k) => k.isHeadshot || k.isSliding || k.isWallRunning);
  specialKills.forEach((k) => {
    const isSlide = k.isSliding;
    const isHeadshot = k.isHeadshot;
    const title = isSlide ? 'Slide-Boost Takedown' : isHeadshot ? 'Precision Headshot Snip' : 'Parkour Wall Frag';
    const badge = isSlide ? 'SLIDE KILL' : isHeadshot ? 'CLEAN HEADSHOT' : 'PARKOUR FRAG';
    const badgeColor = isSlide ? 'cyan' : isHeadshot ? 'purple' : 'emerald';
    const category: MatchHighlight['category'] = isSlide ? 'clutch_play' : isHeadshot ? 'headshot_spree' : 'clutch_play';

    const score = Math.round(380 + k.damage * 2.0 + (isHeadshot ? 250 : 0) + (isSlide ? 200 : 0) + k.streak * 80);

    candidates.push({
      category,
      title,
      badge,
      badgeColor,
      score,
      killsCount: 1,
      damageDealt: Math.max(100, k.damage),
      headshotsCount: isHeadshot ? 1 : 0,
      weaponName: k.weapon || primaryWeaponName,
      weaponId: k.weaponId || primaryWeaponId,
      streakCount: k.streak,
      startSec: Math.max(0, k.matchElapsedSec - 2.0),
      endSec: k.matchElapsedSec + 1.0,
      victims: [k.victim],
      description: isSlide
        ? `Executed tactical slide-entry and eliminated ${k.victim} in motion.`
        : `Landed high-velocity critical headshot on ${k.victim}.`,
      timeline: [
        {
          offsetSec: 0.0,
          type: isSlide ? 'slide_action' : 'hit',
          description: isSlide ? 'Initiated high-speed slide boost' : 'Acquired target lock',
          weapon: k.weapon
        },
        {
          offsetSec: 0.8,
          type: isHeadshot ? 'headshot_kill' : 'kill',
          description: `Eliminated ${k.victim} with ${k.weapon} (${k.damage} DMG)`,
          damage: k.damage,
          target: k.victim,
          badge: isHeadshot ? 'CRIT HEADSHOT' : 'TAKEDOWN'
        }
      ]
    });
  });

  // 4. Sort and deduplicate candidates by score and overlapping startSec
  candidates.sort((a, b) => b.score - a.score);

  const nonOverlapping: RawPlayCandidate[] = [];
  for (const cand of candidates) {
    const overlaps = nonOverlapping.some(
      (existing) => Math.abs(existing.startSec - cand.startSec) < 6.0
    );
    if (!overlaps) {
      nonOverlapping.push(cand);
    }
    if (nonOverlapping.length >= 3) break;
  }

  // 5. If we still have fewer than 3 plays, fill with realistic procedural highlights
  // utilizing any match kills, damage, or simulated peak clutch moments
  const botPool = [...fallbackBotNames];
  while (nonOverlapping.length < 3) {
    const idx = nonOverlapping.length;
    const bot1 = botPool[idx % botPool.length] || 'ApexViper';
    const bot2 = botPool[(idx + 1) % botPool.length] || 'GhostMatrix';
    const simTime = 45 + idx * 38;

    if (idx === 0) {
      // #1 Fallback
      nonOverlapping.push({
        category: finalKills >= 2 ? 'multi_kill' : 'high_damage',
        title: finalKills >= 2 ? 'Opening Multi-Frag Burst' : 'Tactical Alpha Ambush',
        badge: finalKills >= 2 ? 'RAPID FRAGS' : 'HIGH IMPACT',
        badgeColor: 'amber',
        score: 880 + finalKills * 120,
        killsCount: Math.max(1, Math.min(2, finalKills)),
        damageDealt: Math.max(140, finalKills * 90),
        headshotsCount: 1,
        weaponName: primaryWeaponName,
        weaponId: primaryWeaponId,
        streakCount: Math.max(1, bestStreak),
        startSec: simTime,
        endSec: simTime + 3.8,
        victims: [bot1, bot2],
        description: `Delivered high-impact burst fire with ${primaryWeaponName} securing zone superiority.`,
        timeline: [
          { offsetSec: 0.0, type: 'hit', description: `Engaged ${bot1} with ${primaryWeaponName}`, damage: 45, target: bot1 },
          { offsetSec: 1.4, type: 'kill', description: `Eliminated ${bot1} with chest burst`, damage: 75, target: bot1, badge: 'FRAG CONFIRMED' },
          { offsetSec: 2.9, type: 'hit', description: `Suppressed advancing ${bot2}`, damage: 40, target: bot2 }
        ]
      });
    } else if (idx === 1) {
      // #2 Fallback
      nonOverlapping.push({
        category: 'headshot_spree',
        title: 'Precision Sight Acquisition',
        badge: 'PRECISION STRIKE',
        badgeColor: 'purple',
        score: 720 + finalKills * 80,
        killsCount: 1,
        damageDealt: 120,
        headshotsCount: 1,
        weaponName: primaryWeaponName,
        weaponId: primaryWeaponId,
        streakCount: Math.max(1, bestStreak),
        startSec: simTime + 18,
        endSec: simTime + 21.2,
        victims: [bot1],
        description: `Downed ${bot1} in a fast-reflex direct sight engagement.`,
        timeline: [
          { offsetSec: 0.0, type: 'hit', description: `ADS snapshot on ${bot1}`, damage: 35, target: bot1 },
          { offsetSec: 1.1, type: 'headshot_kill', description: `Critical headshot finished ${bot1}`, damage: 85, target: bot1, badge: 'HEADSHOT' }
        ]
      });
    } else {
      // #3 Fallback
      nonOverlapping.push({
        category: 'clutch_play',
        title: 'Tactical Perimeter Hold',
        badge: 'CLUTCH DEFENSE',
        badgeColor: 'cyan',
        score: 590,
        killsCount: 1,
        damageDealt: 110,
        headshotsCount: 0,
        weaponName: primaryWeaponName,
        weaponId: primaryWeaponId,
        streakCount: 1,
        startSec: simTime + 35,
        endSec: simTime + 38.0,
        victims: [bot2],
        description: `Defended corridor chokepoint against flanking hostile patrol.`,
        timeline: [
          { offsetSec: 0.0, type: 'hit', description: `Point-blank crossfire on ${bot2}`, damage: 40, target: bot2 },
          { offsetSec: 1.6, type: 'kill', description: `Neutralized ${bot2} with ${primaryWeaponName}`, damage: 70, target: bot2, badge: 'NEUTRALIZED' }
        ]
      });
    }
  }

  // Convert top 3 to final MatchHighlight objects
  return nonOverlapping.slice(0, 3).map((play, index) => {
    const rank = (index + 1) as 1 | 2 | 3;
    let grade: MatchHighlight['grade'] = 'A';
    if (play.score >= 1200) grade = 'S+';
    else if (play.score >= 900) grade = 'S';
    else if (play.score >= 650) grade = 'A+';

    return {
      id: `highlight_${rank}_${play.startSec.toFixed(0)}`,
      rank,
      title: play.title,
      category: play.category,
      badge: play.badge,
      badgeColor: play.badgeColor,
      score: play.score,
      grade,
      killsCount: play.killsCount,
      damageDealt: play.damageDealt,
      headshotsCount: play.headshotsCount,
      weaponName: play.weaponName,
      weaponId: play.weaponId,
      streakCount: play.streakCount,
      matchTimeFormatted: formatMatchTime(play.startSec),
      matchTimeSec: play.startSec,
      durationSec: parseFloat((play.endSec - play.startSec).toFixed(1)),
      victims: play.victims,
      description: play.description,
      timeline: play.timeline
    };
  });
}
