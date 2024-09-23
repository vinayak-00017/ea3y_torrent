'use strict';

import getPeers from './tracker.js';
import {open} from './torrent-parser.js';

const torrent = open('big-buck-bunny.torrent');
console.log(torrent.announce.toString('utf8'))

getPeers(torrent, peers => {
    console.log('list of peers: ', peers)
})
