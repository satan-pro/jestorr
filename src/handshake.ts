const fs = require("fs");
const net = require("net")
import { parseTorrent, computeHash } from "./torrentParser";
import { encodeBencode } from "./bencodeEncoder";


export function getHandshake([arg1, arg2]: any): void {
  const torrent = fs.readFileSync(arg1);
  const decoded = parseTorrent(torrent.toString("binary"));
  if (decoded == null) {
    throw new Error("Invalid torrent file");
  }

  const info = decoded["info"];
  const bencodedInfo = encodeBencode(info);
  const bufferInfo = Buffer.from(bencodedInfo, "binary");
  const infoHash = computeHash(bufferInfo);
  const hostAndPort = arg2.split(":");

  const connection = net.createConnection({host: hostAndPort[0], port: parseInt(hostAndPort[1])}, () => {
    connection.write(
        Buffer.concat([
            Buffer.from([19]),
            Buffer.from("BitTorrent protocol"),
            Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
            Buffer.from(infoHash, "hex"),
            Buffer.from("12345678901234567890"),
        ])
    );
  });

  connection.on("data", (data: any) => {
    console.log("Received handshake response from peer");

    // Extract and print the peer ID (from the response)
    const peerIdReceived = data.slice(48, 68); // The peer ID is located in bytes 48 to 67 (20 bytes)
    console.log("Peer ID:", peerIdReceived.toString("hex"));
    connection.end(); // Close the connection after receiving the handshake
  });

  connection.on("error", (err: any) => {
    console.error("Error:", err.message);
  });
}
