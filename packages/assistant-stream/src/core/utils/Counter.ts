export class Counter {
  private _next = 0;

  up() {
    return this._next++;
  }
}
