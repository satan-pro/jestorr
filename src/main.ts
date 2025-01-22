const fs = require("fs");
import { parseTorrent, computeHash } from "./torrentParser";
import { bencodeType, bencodeTypeDict, decodeBencode } from "./bencodeDecoder";
import { dictEncoder, stringEncoder, encodeBencode } from "./bencodeEncoder";
import { getPeers } from "./peers";

const args = process.argv;

if (args[2] === "decode") {
    const bencodedValue = args[3];
    try {
        const decoded = decodeBencode(bencodedValue);
        console.log(JSON.stringify(decoded));
    } catch (error: any) {
        console.error(error.message);
    }
}
else if(args[2] === "info") {
    const torrentFile = args[3];
    try{
        const torrent = fs.readFileSync(torrentFile);
        // console.log(torrent);
        const decoded = parseTorrent(torrent.toString("binary"));
        if(decoded==null) {
            throw new Error("Invalid torrent file");
        }

        // Save the info dict of the torrent file
        const info = decoded["info"];
        
        // Convert the info dict to a bencode string
        const bencodedInfo = encodeBencode(info);

        console.log(`Tracker URL: ${decoded["announce"]}\nLength: ${info["length"]}`);

        // Compute hash of the bencoded info dict
        const encodedInfo = Buffer.from(bencodedInfo, "binary");
        const infoHash = computeHash(encodedInfo);
        console.log(`Info Hash: ${infoHash}\nPiece Length: ${info["piece length"]}`);

        // extract the pieces of the info dict in the torrent
        const pieces = info["pieces"];
        // convert the pieces from binary string to hexadecimal
        const hexPieces = Buffer.from(pieces, "binary").toString("hex");
        
        console.log(`Piece Hashes: `);
        // NOTE : since each piece contains 20 bytes and 1 bte can accomodate 2 hexadecimal characters, so each piece will contain 40 characters
        // printing each piece at an which are at intervals of 40 characters
        for(let i=0; i<hexPieces.length; i+=40) {
            console.log(`${hexPieces.substring(i, i+40)}`);
        }
    }
    catch(err: any)
    {
        console.log(err.message);
    }
}
else if(args[2]==="peers") {
    getPeers(args[3]);
}
else if(args[2]==="test") {
    const torrentFile = args[3];
    try{
        
    }
    catch(err: any)
    {
        console.log(err.message);
    }
}