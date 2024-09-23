'use strict';

import dgram from 'dgram';
import {URL} from 'url';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import genId from './util.js';  
import { resolve } from 'path';
import {size, infoHash} from './torrent-parser.js'


const  getPeers = async(torrent, callback) => {

    if(torrent['announce-list']){

        const trackerUrls = torrent['announce-list'];
        
        for (let trackerUrl of trackerUrls) {
            const isSuccessful = await new Promise(resolve => {
              const socket = dgram.createSocket('udp4');
              const tracker = trackerUrl[0].toString('utf8');
              const url = urlParse(tracker);
              udpSend(socket, buildConnReq(), url);
        
              socket.on('message', response => {
                if (respType(response) === 'connect') {
                    console.log("connected")
                  const connResp = parseConnResp(response);
                  const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
                  udpSend(socket, announceReq, url);
                  resolve(true);
                } else if (respType(response) === 'announce') {
                  const announceResp = parseAnnounceResp(response);
                  callback(announceResp.peers);
                  resolve(true);
                }
              });
        
              socket.on('error', error => {
                console.error(`Failed to connect to tracker ${trackerUrl}: ${error.message}`);
                resolve(false);
              });
                // Add a timeout
                setTimeout(() => {
                    console.log(`No response from tracker ${trackerUrl}, moving on to next tracker.`);
                    resolve(false);
                }, 5000); // 5 seconds timeout
                    });
        
            if (isSuccessful) {
              break;
            }
          }
    }
}


const urlParse = (urlString) => 
    new URL(urlString)
    
function udpSend(socket, message, rawUrl, callback = () => {    console.log("done")}){
    const url = urlParse(rawUrl);
    const port = url.port || 53
    socket.send(message, 0, message.length, port, url.hostname, callback);
}

function buildConnReq(){
    const buf = Buffer.alloc(16);

    //connection id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980,4);

    //action
    buf.writeUInt32BE(0,8);
    //transaction id
    crypto.randomBytes(4).copy(buf,12);

    return buf;
}
    
function respType(resp){
    const action = resp.readUInt32BE(0);
    if (action === 0 ) return 'connect';
    if (action === 1) return 'announce';
}

function parseConnResp(resp){
    return{
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId, torrent, port=6881){
    const buf = Buffer.allocUnsafe(98);

    //connection id
    connId.copy(buf, 0);
    //action
    buf.writeUInt32BE(1,8);
    //transaction id 
    crypto.randomBytes(4).copy(buf, 12);
    //info hash
    infoHash(torrent).copy(buf, 16);
    //peerId
    genId().copy(buf,36);
    //downloaded
    Buffer.alloc(8).copy(buf, 56);
    //left
    size(torrent).copy(buf, 64);
    //uploaded
    Buffer.alloc(8).copy(buf, 72);
    //event
    buf.writeUInt32BE(0, 80);
    //ip address
    buf.writeUInt32BE(0,84);
    //key
    crypto.randomBytes(4).copy(buf, 88);
    //num want
    buf.writeInt32BE(-1,92);
    //port
    buf.writeUint16BE(port, 96);

    return buf;
}

function parseAnnounceResp(resp){
    function group(iterable, groupSize){
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize){
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0,4).join('.'),
                port: address.readUInt16BE(4)
            }
           
        })

    }
}


export default getPeers;