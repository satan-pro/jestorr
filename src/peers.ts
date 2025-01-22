const fs = require("fs");
import { parseTorrent, computeHash } from "./torrentParser";
import { bencodeType, bencodeTypeDict, decodeBencode } from "./bencodeDecoder";
import { dictEncoder, encodeBencode } from "./bencodeEncoder";
import axios from "axios";

export function decodePeers(peers: string): string[] {
  const peerList: string[] = [];

  if(peers==null || peers.length===0) {
    console.log("No peers found");
    return peerList;
  }

  for (let pos = 0; pos < peers.length; pos += 6) {
    peerList.push(
      peers
        .slice(pos + 0, pos + 4)
        .split("")
        .map((c) => c.charCodeAt(0))
        .join(".") +
        ":" +
        (peers.charCodeAt(pos + 4) * 256 + peers.charCodeAt(pos + 5))
    );
  }
  return peerList;
}

export function getPeers(torrentFile: any): any {
  try {
    const torrent = fs.readFileSync(torrentFile);
    const decoded = parseTorrent(torrent.toString("binary"));
    if (decoded == null) {
      throw new Error("Invalid torrent file");
    }

    const info = decoded["info"];
    const bencodedInfo = encodeBencode(info);
    const bufferInfo = Buffer.from(bencodedInfo, "binary");
    const infoHash = computeHash(bufferInfo);

    const infoHashEncoded = infoHash
      .match(/.{1,2}/g)
      ?.map((byte: string) => `%${byte}`)
      .join("");

    const peerId = "12345678901234567890";
    const port = 6681;
    const uploaded = 0;
    const downloaded = 0;
    const left = info["length"];
    const compact = 1;

    const url = `${decoded["announce"]}?info_hash=${infoHashEncoded}&peer_id=${peerId}&port=${port}&uploaded=${uploaded}&downloaded=${downloaded}&left=${left}&compact=${compact}`;

    axios.get(url, {responseType: "arraybuffer"}).then((response) => {
      const buffer = response.data;
      console.log(response.data);
      const decodedData = decodeBencode(Buffer.from(buffer).toString("binary"));
      console.log(decodedData);
      
      decodePeers(decodedData.peers).forEach((peer)=> console.log(peer));
    })
    .catch((error)=>{
      console.log(`Error fetching or decoding peers: ${error.message}`);
    });

    // fetch(url)
    //   .then((response) => response.arrayBuffer())
    //   .then((buffer) => {
    //     const data = decodeBencode(Buffer.from(buffer).toString("binary"));
    //     console.log("Decoded Data:", data);
    //     // Call `getPeers` with the decoded data
    //     decodePeers(data.peers).forEach((peer) => console.log(peer));
    //   })
    //   .catch((error) => {   
    //     // Handle any errors
    //     console.error("Error fetching or decoding:", error.message);
    //   });
  } catch (err: any) {
    console.log(err.message);
  }
}
