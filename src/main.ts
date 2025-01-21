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

        const decodedInfo = dictEncoder(decoded["info"] as bencodeTypeDict);

        console.log(`Tracker URL: ${decoded["announce"]}\nLength: ${(decoded["info"] as bencodeTypeDict)["length"]}`);

        const infoHash = computeHash(decodedInfo);
        console.log(`Info Hash: ${infoHash}`);
    }
    catch(err: any)
    {
        console.log(err.message);
    }
}
