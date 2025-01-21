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
            encoded+= stringEncoder(value);
        }
        else if(typeof value==="number") {
            encoded+= numberEncoder(value);
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

export function encodeBencode(content: bencodeTypeDict): string {
    let encoded = "d";
    const keys = Object.keys(content);

    for(const key of keys) {
        const value = content[key];
        encoded += `${key.length}:${key}`;

        if(typeof(value)==="string") {
            encoded+= `${value.length}:${value}`;
        }
        else if(typeof(value)==="number") {
            encoded+= `i${value}e`;
        }
        else if(Array.isArray(value)) {
            encoded+="l";
            encoded+= value.map((item)=> encodeBencode(item as bencodeTypeDict)).join("");
        }
        else if(typeof(value)==="object") {
            encoded+= encodeBencode(value as bencodeTypeDict);
        }
    }

    encoded+="e";
    return encoded;
}

export { stringEncoder, numberEncoder, listEncoder, dictEncoder };