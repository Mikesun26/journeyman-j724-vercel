import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/mission-pack.js';
export default toVercel(fn as any);
