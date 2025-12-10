import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/chaoschain.js';
export default toVercel(fn as any);
