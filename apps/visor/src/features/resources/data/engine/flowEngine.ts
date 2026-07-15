import type { ProspectProfile, SmartBlock, ProfileTag } from '../../types';
import { getBlocksBySection, getSmartBlock } from '../smartBlocks';
import { generateTags, matchScore } from '../profile/profileEngine';

export interface FlowRecommendation {
  block: SmartBlock;
  score: number;
  reason: string;
}

export function getRecommendedBlocks(
  profile: ProspectProfile,
  sectionId: string,
  usedBlockIds: string[]
): FlowRecommendation[] {
  const blocks = getBlocksBySection(sectionId);
  const profileTags = profile.generatedTags.length > 0
    ? profile.generatedTags
    : generateTags(profile);

  const recommendations: FlowRecommendation[] = [];

  for (const block of blocks) {
    if (usedBlockIds.includes(block.id)) continue;

    const score = calculateScore(block, profileTags, usedBlockIds);
    const reason = getRecommendationReason(block, profileTags);

    recommendations.push({ block, score, reason });
  }

  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}

function calculateScore(
  block: SmartBlock,
  profileTags: ProfileTag[],
  usedBlockIds: string[]
): number {
  let score = block.priority / 5;

  const tagMatch = matchScore(block.tags, profileTags);
  score += tagMatch * 0.3;

  if (block.priority === 5) score += 0.1;

  return Math.min(score, 1);
}

function getRecommendationReason(block: SmartBlock, profileTags: ProfileTag[]): string {
  if (block.tags.length === 0) return 'Block general';

  const matches = block.tags.filter(t => profileTags.includes(t));
  if (matches.length > 0) {
    return `Relevante para: ${matches.join(', ')}`;
  }

  return 'Recomendado para avanzar';
}

export function suggestNext(
  currentBlockId: string,
  signal: 'positive' | 'negative' | 'neutral',
  profile: ProspectProfile
): string | null {
  const block = getSmartBlock(currentBlockId);
  if (!block) return null;

  if (signal === 'positive') {
    return block.nextIfPositive || null;
  }

  if (signal === 'negative') {
    return block.nextIfNegative || null;
  }

  return null;
}

export function canAdvance(
  sectionId: string,
  profile: ProspectProfile,
  usedBlockIds: string[]
): { ready: boolean; missing: string[] } {
  const missing: string[] = [];

  if (sectionId === 'sondeo') {
    if (profile.motivations.length === 0) missing.push('Motivación');
    if (profile.painPoints.length === 0) missing.push('Dolor principal');
    if (!profile.situation.trabaja && !profile.situation.tieneHijos && !profile.situation.primeraUniversidad) {
      missing.push('Situación actual');
    }
  }

  if (sectionId === 'personalizar') {
    const hasUsed = usedBlockIds.some(id => id.startsWith('pers_'));
    if (!hasUsed) missing.push('Al menos un block de personalización');
  }

  if (sectionId === 'costos') {
    if (profile.decision === null) missing.push('Decisión SÍ/NO');
  }

  return { ready: missing.length === 0, missing };
}

export function detectProfileTags(profile: ProspectProfile): ProfileTag[] {
  return generateTags(profile);
}
