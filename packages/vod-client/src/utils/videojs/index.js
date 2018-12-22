import videojs from 'video.js';

/**
 * hls
 */

// const videojsHlsjsSourceHandler = require('videojs-hlsjs-plugin');
// videojsHlsjsSourceHandler.register(videojs);
// import './hls/qualityPickerPlugin';

/**
 * dash
 */
import videojsDashjsSourceHandler from './dash/registerDashSourceHandler';
videojsDashjsSourceHandler.register(videojs);
require('./dash/qualityPickerPlugin');
