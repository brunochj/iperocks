import alertsData from '@/data/alerts.json';
import blocksData from '@/data/blocks.json';
import linesData from '@/data/lines.json';
import sectorsData from '@/data/sectors.json';

type Sector = (typeof sectorsData)[number];
type Block = (typeof blocksData)[number];
type Line = (typeof linesData)[number];
type Alert = (typeof alertsData)[number];

export function getSectors(): Sector[] {
  return [...sectorsData].sort((a, b) => a.order - b.order);
}

export function getBlocksBySector(sectorId: string): Block[] {
  return blocksData
    .filter((block) => block.sectorId === sectorId)
    .sort((a, b) => a.order - b.order);
}

export function getBlockById(blockId: string): Block | undefined {
  return blocksData.find((block) => block.id === blockId);
}

export function getLinesByBlock(blockId: string): Line[] {
  return linesData
    .filter((line) => line.blockId === blockId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAlertsByLine(lineIds: string[]) {
  const alertsByLine: Record<string, string[]> = {};

  for (const alert of alertsData as Alert[]) {
    if (!lineIds.includes(alert.lineId) || alert.resolved) continue;
    if (!alertsByLine[alert.lineId]) alertsByLine[alert.lineId] = [];
    alertsByLine[alert.lineId].push(alert.type);
  }

  return alertsByLine;
}
