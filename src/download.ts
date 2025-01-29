const fs = require("fs");
const net = require("net");
import { computeHashBuffer } from "./torrentParser";

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
export async function downloadPiece(torrent: any, connection: any, pieceLength: number, pieceIndex: number): Promise<Buffer> {
    console.log("downloading");

    
    let pieceHashes = torrent["info"]["pieces"];

    return new Promise((resolve, reject)=>{
        let receivedData = Buffer.alloc(0);
        const blocks: {[key: number]: Buffer} = {};
        const BLOCK_SIZE = 16*1024; // 16 kB
        const numBlocks = Math.ceil(pieceLength/BLOCK_SIZE);

        function sendInterestedMessage() {
            const message = Buffer.alloc(5);
            message.writeUInt32BE(1,0); // length prefix (1 byte payload)
            message.writeUInt8(messageTypes.INTERESTED, 4); // message id
            connection.write(message);
        }

        function sendRequestMessage(blockIndex: number) {
            const begin = blockIndex * BLOCK_SIZE;
            const blockLength = Math.min(BLOCK_SIZE, pieceLength - begin);

            const message = Buffer.alloc(17);
            message.writeUInt32BE(13, 0); // length prefix (13 byte payload)
            message.writeUInt8(messageTypes.REQUEST, 4); // message id
            message.writeUInt32BE(pieceIndex, 5); // piece index
            message.writeUInt32BE(begin, 9); // begin offset
            message.writeUInt32BE(blockLength, 13); // block length
            connection.write(message);
        }

        connection.on("data", (data: any)=>{
            receivedData = Buffer.concat([receivedData, data]);

            while(receivedData.length >= 4) {
                const messageLength = receivedData.readUInt32BE(0);
                if(receivedData.length < messageLength + 4) {
                    break;
                }

                const messageId = receivedData[4];
                const payload = receivedData.slice(5, messageLength + 4);

                switch(messageId) {
                    case messageTypes.BITFIELD:
                        sendInterestedMessage();
                        break;

                    case messageTypes.UNCHOKE:
                        // request blocks
                        for(let i = 0; i<numBlocks; i++) {
                            sendRequestMessage(i);
                        }
                        break;

                    case messageTypes.PIECE:
                        const blockIndex = payload.readUInt32BE(4)/BLOCK_SIZE;
                        blocks[blockIndex] = payload.slice(8);

                        // check if all blocks are received
                        if(Object.keys(blocks).length===numBlocks) {
                            // Combine all blocks into a single piece
                            const completePiece = Buffer.concat(
                                Array.from({length: numBlocks}, (_, i)=>blocks[i])
                            );
                            connection.end();
                            resolve(completePiece);
                        }
                        break;
                }
                
                receivedData = receivedData.slice(messageLength + 4);
            }
        });

        connection.on("error", (err: any)=>{
            reject(err);
        });
    });
}