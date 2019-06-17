
// source: https://jsperf.com/hashcodelordvlad
export function GetStringHash(s: string) {
    let hash = 0,
        i, char;
    if (s.length == 0) return hash;
    const l = s.length;
    for (i = 0; i < l; i++) {
        char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};