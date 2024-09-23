'use strict';

import crypto from 'crypto';
import { Buffer } from 'buffer';

let id = null;

const genId = () => {
    if (!id){
        id = crypto.randomBytes(20);
        Buffer.from('-ET0001-').copy(id,0)
    }
    return id;
}

export default genId;