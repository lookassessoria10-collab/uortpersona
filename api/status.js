// GET /api/status — diagnóstico: onde as respostas são gravadas e se a chave confere.
import { storageKind } from '../lib/store.js';
import { handler, send, keyConfigured, isPresenter } from '../lib/http.js';

export default handler(async (req, res) => {
  send(res, 200, { storage: storageKind(), keyConfigured: keyConfigured(), presenter: isPresenter(req) });
});
