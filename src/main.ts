const fs = require("fs");
import { parseTorrent, computeHash } from "./torrentParser";
import { bencodeType, bencodeTypeDict, decodeBencode } from "./bencodeDecoder";
import { dictEncoder } from "./bencodeEncoder";

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
        const torrent = fs.readFileSync(torrentFile, "utf-8");
        // console.log(torrent);
        const decoded = parseTorrent(torrent);
        if(!decoded["announce"] || !decoded["info"]) {
            throw new Error("Invalid torrent file");
        }

        // Save the info dict of the torrent file
        const info = decoded["info"] as bencodeTypeDict;
        
        // Convert the info dict to a bencode string
        const decodedInfo = dictEncoder(info);

        console.log(`Tracker URL: ${decoded["announce"]}\nLength: ${info["length"]}`);

        // Compute hash of the bencoded info dict
        const infoHash = computeHash(decodedInfo);
        console.log(`Info Hash: ${infoHash}\nPiece Length: ${info["piece length"]}`);

        // extract the pieces of the info dict in the torrent
        const pieces = info["pieces"] as string;
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
