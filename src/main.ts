// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
interface bencodeTypeDict {
    [key: string]: bencodeType;
}

type bencodeType = string | number | bencodeType[] | bencodeTypeDict;

function decodeBencode(bencodedValue: string): bencodeType {
    if (!bencodedValue || bencodedValue.length === 0) {
        throw new Error("Invalid input: empty string");
    }

    let idx = 0; // Keep track of the current index during decoding

    function decode(): bencodeType {
        const char = bencodedValue[idx];

        // Check for string (length:value)
        if (!isNaN(parseInt(char))) {
            const colonIndex = bencodedValue.indexOf(":", idx);
            if (colonIndex === -1) {
                throw new Error("Invalid string format");
            }
            const length = parseInt(bencodedValue.substring(idx, colonIndex));
            idx = colonIndex + 1; // Move index past the colon
            const str = bencodedValue.substring(idx, idx + length);
            idx += length; // Move index past the string content
            return str;
        }

        // Check for integer (i<number>e)
        else if (char === "i") {
            const endIdx = bencodedValue.indexOf("e", idx);
            if (endIdx === -1) {
                throw new Error("Invalid integer format");
            }
            const num = parseInt(bencodedValue.substring(idx + 1, endIdx));
            idx = endIdx + 1; // Move index past 'e'
            return num;
        }

        // Check for list (l...e)
        else if (char === "l") {
            idx++; // Skip 'l'
            const list: bencodeType[] = [];
            while (bencodedValue[idx] !== "e") {
                if (idx >= bencodedValue.length) {
                    throw new Error("Invalid list format");
                }
                list.push(decode());
            }
            idx++; // Skip 'e'
            return list;
        }

        else if (char==="d") {
            idx++; // Skip 'd'
            const dict: bencodeTypeDict = {};
            while(bencodedValue[idx]!=="e") {
                if (idx >= bencodedValue.length) {
                    throw new Error("Invalid dictionary format");
                }
                const key = decode() as string;
                const value = decode();
                dict[key] = value;
            }
            idx++;
            return dict;
        }
        
        throw new Error(`Unknown bencoded format at position ${idx}`);
    }

    return decode();
}

const args = process.argv;
const bencodedValue = args[3];

if (args[2] === "decode") {
    try {
        const decoded = decodeBencode(bencodedValue);
        console.log(JSON.stringify(decoded));
    } catch (error: any) {
        console.error(error.message);
    }
}
