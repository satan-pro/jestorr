const fs = require("fs");
const net = require("net");
import { parseTorrent, computeHashBuffer } from "./torrentParser";
import { encodeBencode } from "./bencodeEncoder";
import { writeFileSync } from "fs";

const messageTypes = {
    CHOKE: 0,
    UNCHOKE: 1,
    INTERESTED: 2,
    NOTINTERESTED: 3,
    HAVE: 4,
    BITFIELD: 5,
    REQUEST: 6,
    PIECE: 7,
};

// send decoded file as torrent
export async function downloadPiece(torrentFile: any, peer: any, pieceIndexStr: any, filePath: string) {
    try {
        const pieceIndex = parseInt(pieceIndexStr, 10);
        const torrent = fs.readFileSync(torrentFile);
        const decoded = parseTorrent(torrent.toString("binary"));
        const info = decoded["info"];
        const bencodedInfo = encodeBencode(info);
        const bufferInfo = Buffer.from(bencodedInfo, "binary");
        const infoHash = computeHashBuffer(bufferInfo);
  
        console.log("Starting download....");
  
        const standardPieceLength = decoded["info"]["piece length"];
        const totalLength = decoded["info"]["length"];
        const isLastPiece =
          pieceIndex === Math.ceil(totalLength / standardPieceLength) - 1;
        const pieceLength = isLastPiece
          ? totalLength % standardPieceLength || standardPieceLength
          : standardPieceLength;
  
        // Get peer list
        const [peerIp, peerPort] = peer.split(":");
        console.log(`Connecting to peer ${peerIp} on port ${peerPort}`);
  
        let downloadSuccess = false;
  
        await new Promise<void>((resolve, reject) => {
          const connection = net.createConnection(parseInt(peerPort, 10), peerIp);
          let handshakeDone = false;
          let receivedData = Buffer.alloc(0);
          let pieceData = Buffer.alloc(0);
          let requestSent = 0;
          let blocksReceived = 0;
          const expectedBlocks = Math.ceil(pieceLength/ (16*1024));
  
          console.log(`Expected blocks : ${expectedBlocks}`);
  
          const timeout = setTimeout(() => {
              console.log(`Download timeout occured`);
              connection.destroy();
              reject(new Error("Download timeout"));
          }, 30000);
  
          // Can be replaced from handshake.ts
          connection.on("connect", () => {
              console.log(`Sending handshake`);
              const handshake = Buffer.alloc(68);
              handshake.writeUInt8(19, 0);
            handshake.write("BitTorrent protocol", 1);
            // Fill reserved bytes with zeros
            handshake.fill(0, 20, 28);
            infoHash.copy(handshake, 28);
            Buffer.from("12345678901234567890").copy(handshake, 48);
            connection.write(handshake);
            console.log("Handshake sent");
          });
  
          connection.on("data", (data: any) => {
              receivedData = Buffer.concat([receivedData, data]);
  
              // Check if handshake is done
              if(!handshakeDone && receivedData.length>=68) {
                  console.log(`Received complete handshake`);
                  handshakeDone = true;
                  receivedData = receivedData.slice(68);
              }
  
              // Process messages
              while(receivedData.length >= 4) {
                  const messageLength = receivedData.readUInt32BE(0);
                  if(receivedData.length < messageLength + 4) {
                      break;
                  }
                  if(messageLength > 0) {
                      const messageId = receivedData[4];
                      const payload = receivedData.slice(5, messageLength + 4);
  
                      switch(messageId) {
                          case 5: // Bitfield
                              console.log(`Received bitfield: ${payload.toString("hex")}`);
                              const interested = Buffer.alloc(5);
                              interested.writeUInt32BE(1, 0);
                              interested.writeUInt8(2, 4);
                              connection.write(interested);
                              break;
  
                          case 1: // unchoke
                              console.log(`Received unchoke, sending requests`);
                              const BLOCK_SIZE = 16*1024;
                              const numBlocks = Math.ceil(pieceLength/BLOCK_SIZE);
  
                              for(let blockIndex = 0; blockIndex<numBlocks; blockIndex++) {
                                  const begin = blockIndex * BLOCK_SIZE;
                                  const blockLength = Math.min(BLOCK_SIZE, pieceLength - begin);
  
                                  const request = Buffer.alloc(17);
                                  request.writeUInt32BE(13, 0);
                                  request.writeUInt8(6, 4);
                                  request.writeUInt32BE(pieceIndex, 5);
                                  request.writeUInt32BE(begin, 9);
                                  request.writeUInt32BE(blockLength, 13);
                                  connection.write(request);
                                  requestSent++;
                              }
                              console.log(`Sent ${requestSent} requests`);
                              break;
  
                          case 7: // Piece
                              blocksReceived++;
                              console.log(`Received block ${blocksReceived}/${expectedBlocks}`);
                              const block = payload.slice(8);
                              pieceData = Buffer.concat([pieceData, block]);
  
                              if(blocksReceived === expectedBlocks) {
                                  console.log(`All blocks received, writing file`);
                                  writeFileSync(filePath, pieceData);
                                  downloadSuccess = true;
                                  clearTimeout(timeout);
                                  connection.end();
                                  resolve();
                              }
                              break;
  
                          default: 
                              console.log(`Receieved message with id: ${messageId}`);
                              break;
                      }
                  }
                  receivedData = receivedData.slice(messageLength + 4);
              }
          });
  
          connection.on("error", (err: any) => {
              console.log(`Connection error: ${err.message}`);
              clearTimeout(timeout);
              reject(err);
          });
  
          connection.on("end", () => {
              console.log(`Connection closed`);
              clearTimeout(timeout);
              if(!downloadSuccess) {
                  reject(new Error("Connection closed before download completion"));
              }
          });
        });
  
        if(!downloadSuccess) {
            throw new Error(`Failed to download piece`);
        }
  
        console.log(`Piece ${pieceIndex} downloaded successfully to ${filePath}`);
      } catch (err: any) {
        console.log(err.message);
      }
}