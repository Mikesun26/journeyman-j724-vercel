import { toVercel } from './_adapter';
import * as fn from '../netlify/functions/itinerary.js';
export default toVercel(fn as any);
