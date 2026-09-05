import { handleOwner } from './_lib/owner';
import { header, run, type ApiRequest, type ApiResponse } from './_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse) {
  return run(req, res, () => handleOwner(req.body, header(req, 'authorization')));
}
