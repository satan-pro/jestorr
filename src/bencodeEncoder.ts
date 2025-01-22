import { bencodeTypeDict } from "./bencodeDecoder";

const stringEncoder = (value: string): string => {
    const length = value.length;
    return `${length}:${value}`;
}

const numberEncoder = (value: number): string => {
    return `i${value}e`;
}

const listEncoder = (list: any): string => {
    let encoded = "";
    for(let item of list) {
        if(typeof item==="string") {
            encoded+= stringEncoder(item);
        }
        else if(typeof item==="number") {
            encoded+= numberEncoder(item);
        }
        else if(Array.isArray(item)) {
            encoded+= listEncoder(item);
        }
        else if(typeof item==="object" && item!=null && !Array.isArray(item)) {
            encoded+= dictEncoder(item);
        }
    }
    return `l${encoded}e`;
}

const dictEncoder = (dict: bencodeTypeDict): string => {
    let encoded = "";
    for(let item in dict) {
        const key = stringEncoder(item);
        const value = dict[item];

        encoded+=`${key}`;
        if(typeof value==="string") {
            encoded.concat(stringEncoder(value));
        }
        else if(typeof value==="number") {
            encoded.concat(numberEncoder(value));
        }
        else if(Array.isArray(value)) {
            encoded+= listEncoder(value);
        }
        else if(typeof value==="object" && value!=null && !Array.isArray(value)) {
            encoded+= dictEncoder(value);
        }
    }
    return `d${encoded}e`;
}

export function encodeBencode(value: any): string {
    if(typeof value==="number") {
        return `i${value}e`;
    }
    else if(typeof value==="string") {
        return `${value.length}:${value}`;
    }
    else if(Array.isArray(value)) {
        let encodedList = "l";
        for(let item of value) {
            encodedList+= encodeBencode(item);
        }
        return `${encodedList}e`;
    }
    else if(typeof value==="object" && value!=null) {
        let encodedDict = "d";
        const sortedKeys = Object.keys(value).sort();
        for(let key of sortedKeys) {
            encodedDict+= encodeBencode(key);
            encodedDict+= encodeBencode(value[key]);
        }
        return `${encodedDict}e`;
    }
    else {
        throw new Error("Unsupported data type for Bencode encoding");
    }
}

export { stringEncoder, numberEncoder, listEncoder, dictEncoder };