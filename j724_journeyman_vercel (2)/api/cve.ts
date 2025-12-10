import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/cve.js';
export default toVercel(fn as any);
