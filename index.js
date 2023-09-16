import express from 'express';
import { getVideoMetadata } from './utils.js';
import { Directory } from './directory.js';
import config from 'config';

const app = express();
const directory = new Directory(config.directory);

app.set('view engine', 'squirrelly');
app.use(express.static('public'));

app.get('/ping', (req, res) => {
  return res.send('pong');
});

app.get('/', (req, res) => {
  const entities = directory.getEntitiesByParent('index');
  return res.render('list', { url: config.url, entities });
});

app.get('/directory/:id', (req, res) => {
  const entities = directory.getEntitiesByParent(req.params.id);
  return res.render('list', { url: config.url, entities });
});

app.get('/clip/:id', (req, res) => {
  const entity = directory.getEntity(req.params.id);
  if (!entity) {
    return res.status(404).send();
  }
  const metadata = getVideoMetadata(entity);
  return res.render('video', { entity, metadata, url: config.url });
});

app.get('/video/:id', (req, res) => {
  const entity = directory.getEntity(req.params.id);
  return res.sendFile(entity.path);
});

app.get('/thumb/:id', async (req, res) => {
  const thumb = await directory.getThumbnail(req.params.id);
  return res.sendFile(thumb);
});

directory.load().then(() => {
  app.listen(2547);
});
