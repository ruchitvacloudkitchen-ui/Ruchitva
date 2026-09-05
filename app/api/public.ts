import { handlePublic } from './_lib/public';
import { run, type ApiRequest, type ApiResponse } from './_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse) {
  return run(req, res, () => handlePublic(req.body));
}
