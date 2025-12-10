import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/worldtime.js';
export default toVercel(fn as any);
