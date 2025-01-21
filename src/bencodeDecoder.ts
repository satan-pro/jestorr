// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
// - decodeBencode("i123e") -> 123
// - decodeBencode("i-123e") -> -123
// - decodeBencode("l4:spam4:eggse") -> ["spam", "eggs"]
// - decodeBencode("d3:cow3:moo4:spam4:eggse") -> { cow: "moo", spam: "eggs" }

// used for dictionary parsing in bencode
export interface bencodeTypeDict {
    [key: string]: bencodeType;
}

export type bencodeType = string | number | bencodeType[] | bencodeTypeDict;

export function decodeBencode(bencodedValue: string): bencodeType {
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

        // Check for dictionary (d...e)
        else if (char==="d") {
            idx++; // Skip 'd'
            const dict: bencodeTypeDict = {};
            while(bencodedValue[idx]!=="e") {
                if (idx >= bencodedValue.length) {
                    throw new Error("Invalid dictionary format");
                }
                const key = decode() as string; // first extract the key
                const value = decode(); // extract the value for the current key
                dict[key] = value; // add the key-value pair to the dict
            }
            idx++; // Skip 'e'
            return dict;
        }
        
        throw new Error(`Unknown bencoded format at position ${idx}`);
    }

    return decode();
}
