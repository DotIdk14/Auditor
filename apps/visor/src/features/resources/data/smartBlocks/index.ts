import type { SmartBlock } from '../../types';
import { bienvenidaBlocks } from './bienvenidaBlocks';
import { sondeoBlocks } from './sondeoBlocks';
import { personalizarBlocks } from './personalizarBlocks';
import { persuasionBlocks } from './persuasionBlocks';
import { costosBlocks } from './costosBlocks';
import { acordarBlocks } from './acordarBlocks';

export const allSmartBlocks: SmartBlock[] = [
  ...bienvenidaBlocks,
  ...sondeoBlocks,
  ...personalizarBlocks,
  ...persuasionBlocks,
  ...costosBlocks,
  ...acordarBlocks,
];

export const blocksBySection: Record<string, SmartBlock[]> = {
  bienvenida: bienvenidaBlocks,
  sondeo: sondeoBlocks,
  personalizar: personalizarBlocks,
  persuasión: persuasionBlocks,
  costos: costosBlocks,
  acordar: acordarBlocks,
};

export function getSmartBlock(id: string): SmartBlock | undefined {
  return allSmartBlocks.find(b => b.id === id);
}

export function getBlocksBySection(sectionId: string): SmartBlock[] {
  return blocksBySection[sectionId] || [];
}
