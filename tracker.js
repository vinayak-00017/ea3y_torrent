'use strict';

import dgram from 'dgram';
import {URL} from 'url';
import crypto from 'crypto';
import { Buffer } from 'buffer';


const getPeers = (torrent, callback) => {
    
    const url = urlParse(torrent.announce.toString('utf8'));
    const socket = dgram.createSocket('udp4');

    //send connect req
    udpSend(socket, buildConnReq(),url);

    socket.on('message', response => {
        if(respType(response) === 'connect'){
            // recieve and parse connect response
            const connResp = parseConnResp(response);
            // send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId);
            udpSend(socket, announceReq, url);
        }else if (respType(response) === 'announce'){
            // parse announce response
            const announceResp = parseAnnounceResp(response);
            // pass peers to callback
            callback(announceResp.peers);
        }
    })

}


const urlParse = (urlString) => 
    new URL(urlString)
    
function udpSend(socket, message, rawUrl, callback = () => {}){
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.hostname, callback);
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
    
function respType(){

}

function parseConnResp(resp){
    return{
        action: resp.readUInit32BE(0),
        transactionId: resp.readUInit32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId){

}

function parseAnnounceResp(resp){

}


export default getPeers;