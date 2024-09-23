'use strict';

import fs from 'fs';
import bencode from 'bencode';
import { Buffer } from 'buffer';
import BigNum from 'bignum';
import crypto from 'crypto';

export const open = (filePath) => {
    return bencode.decode(fs.readFileSync(filePath),'utf8');
};

export const size = (torrent) => {
    const buf = Buffer.alloc(8)
    const size = torrent.info.files ? 
        torrent.info.files.map(file => file.length).reduce((a,b) => a+b):
        torrent.info.length;
  
    return BigNum.toBuffer(size, {size: 8});
}    

export const infoHash = (torrent) => {
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
}