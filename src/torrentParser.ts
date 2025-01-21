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
export function parseTorrent(torrent: string): bencodeTypeDict {
    const decoded = decodeBencode(torrent);
    const announceDict: bencodeTypeDict = {};
    announceDict["announce"] = (decoded as bencodeTypeDict)["announce"];
    announceDict["info"] = (decoded as bencodeTypeDict)["info"];

    return announceDict;
}

export function computeHash(content: string): string {
   const buffer = Buffer.from(content, "binary");
   const hash = crypto.createHash("sha1");
   hash.update("buffer");
   return hash.digest("hex");
} 