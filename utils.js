import path from 'node:path';
import { readMediaAttributes } from 'leather';

export function fileNameFormat(ent, dir) {
  const { name } = path.parse(ent.name);
  return name.replace(path.basename(dir), '').trim();
}

export function getVideoMetadata(entity) {
  return readMediaAttributes(entity.path);
}
