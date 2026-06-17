import blocks from '@/data/blocks.json';
import sectors from '@/data/sectors.json';

export function getSectorStaticParams() {
  return sectors.map((sector) => ({
    sectorId: sector.id,
  }));
}

export function getBlockStaticParams() {
  return blocks.map((block) => ({
    sectorId: block.sectorId,
    blockId: block.id,
  }));
}
