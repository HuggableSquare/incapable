import { readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import wordhash from 'wordhash';
import thumbsupply from 'thumbsupply';
import { fileNameFormat } from './utils.js';
import chokidar from 'chokidar';

const wordHash = wordhash();

export class Directory {
  entities = [];
  constructor(dir) {
    this.dir = dir;
    // TODO: use chokidar to generate the entities itself
    chokidar.watch(dir, { ignoreInitial: true }).on('all', (event, path) => {
      this.load();
    });
  }

  #createId(string) {
    if (string === this.dir) return 'index';
    const hash = createHash('sha256');
    return wordHash.hash(hash.update(string).digest('hex'));
  }

  async load() {
    const { entities } = await this.#readFolder();
    this.entities = entities;
    return { entities };
  }

  getEntity(id) {
    return this.entities.find((entity) => entity.id === id);
  }

  getEntitiesByParent(id) {
    return this.entities.filter(({ parentDirectoryId }) => parentDirectoryId === id);
  }

  getThumbnail(id) {
    const entity = this.getEntity(id);
    if (entity.isDirectory) {
      return this.#getDirectoryThumbnail(entity);
    }
    return this.#getFileThumbnail(entity);
  }

  #getFileThumbnail(entity) {
    return thumbsupply.generateThumbnail(entity.path);
  }
  
  #getDirectoryThumbnail(entity) {
    const childFile = this.entities.find(({ parentDirectoryId, isDirectory }) => parentDirectoryId === entity.id && !isDirectory);
    if (childFile) return this.#getFileThumbnail(childFile);

    const childDirectory = this.entities.find(({ parentDirectoryId, isDirectory }) => parentDirectoryId === entity.id && isDirectory);
    return this.#getDirectoryThumbnail(childDirectory);
  }

  async #readFolder(dir = this.dir) {
    const entities = [];
    const ents = await readdir(dir, { withFileTypes: true });
    for (const ent of ents) {
      const path = `${dir}/${ent.name}`;
      const entity = {
        id: this.#createId(path),
        name: ent.isFile() ? fileNameFormat(ent, dir) : ent.name,
        parentDirectoryId: this.#createId(dir),
        isDirectory: ent.isDirectory(),
        path
      };
  
      entities.push(entity);
  
      if (ent.isDirectory()) {
        const res = await this.#readFolder(path);
        entity.numberOfChildren = res.entities.filter((entity) => !entity.isDirectory).length;
        entities.push(...res.entities);
      }
    }
    entities.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    return { entities };
  }
}
