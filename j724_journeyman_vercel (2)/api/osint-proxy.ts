import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/osint-proxy.js';
export default toVercel(fn as any);
