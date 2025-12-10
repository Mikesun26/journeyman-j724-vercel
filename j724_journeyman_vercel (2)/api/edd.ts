import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/edd.js';
export default toVercel(fn as any);
