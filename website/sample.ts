import { X } from "ds";

/**
 * Comment
 * Another line
 * Test
 * @param a test
 */
async function x<A, B extends X<P>>(a: X): P {
  return () => a;
}

export { x }
