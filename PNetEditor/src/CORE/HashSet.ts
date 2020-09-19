export class HashSet<T>{
  private colection: { [hash: number]: T[] } = {};

  private readonly hashFnc: (input: T) => number;
  private readonly equalityComparer: (o1: T, o2: T) => boolean;

  public contains(val: T): boolean {
    const hash = this.hashFnc(val);
    const found = this.colection[hash];

    if (!found) return false;

    return found.findIndex(x => { return this.equalityComparer(x, val); }) >= 0;
  }

  /**
   * add value to collection returns false if value already was in collection
   */
  public add(val: T): boolean {
    const hash = this.hashFnc(val);
    const found = this.colection[hash];

    if (!found)
      this.colection[hash] = [val];
    else {
      if (found.findIndex(x => { return this.equalityComparer(x, val); }) >= 0)
        return false;

      this.colection[hash].push(val);
    }

    return true;
  }

  public clear() {
    this.colection = {};
  }

  constructor(hashFunction: (input: T) => number, equalityComparer: (o1: T, o2: T) => boolean) {
    this.hashFnc = hashFunction;
    this.equalityComparer = equalityComparer;
  }
}


// source: https://jsperf.com/hashcodelordvlad
export const GetStringHash = (s: string) => {
  let hash = 0;
  let i: number;
  let char: number;
  if (s.length === 0) return hash;
  const l = s.length;
  for (i = 0; i < l; i++) {
    char = s.charCodeAt(i);
    // tslint:disable
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
    // tslint:enable
  }
  return hash;
};
