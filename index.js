'use strict';
import bencode from 'bencode';
import fs from 'fs';
import getPeers from './tracker';

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'), 'utf8');

getPeers(torrent, peers => {
    console.log('list of peers: ', peers)
})
