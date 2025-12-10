import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/sse.js';
export default toVercel(fn as any);
