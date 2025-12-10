import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/fx.js';
export default toVercel(fn as any);
