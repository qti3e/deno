import { T } from "lib";

/**
 * Doc
 */
type a<D extends T> = {
  /**
   * Sample
   */
  x: number;
};

/**
 * Function
 * Comments
 * Another line
 * @param a Comment for parameter.
 */
function b<X>(a: X, b): void {}

export { a as MyType, b as MyFunction };
