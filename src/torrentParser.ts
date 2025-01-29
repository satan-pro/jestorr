import {decodeBencode, bencodeTypeDict} from "./bencodeDecoder";
import {encodeBencode, dictEncoder} from "./bencodeEncoder";
const crypto = require("crypto");

// parsing the torrent file
// torrent file is a dictionary (d...e) which contains: 
// announce : URL of the tracker, which is a central server that keeps track of the peers participating in the sharing of a torrent
/* info : {
    length: size of the file in bytes, for single-file torrents,
    name: suggested name to save the file,
    piece length: number of bytes in each piece,
    pieces: concatenated SHA-1 hashes of each piece
    }
*/
export function parseTorrent(torrent: any): any {
    const decoded = decodeBencode(torrent);
    return decoded;
}

export function computeHash(content: any): any {
   const hash = crypto.createHash("sha1");
   hash.update(content);
   return hash.digest("hex");
} 

export function computeHashBuffer(content: any): any {
    const hash = crypto.createHash("sha1");
    hash.update(content);
    return hash.digest();
}