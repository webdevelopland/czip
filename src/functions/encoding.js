function int32ToUint8Array(int32) {
  return Uint8Array.of(
    (int32 & 0xff000000) >> 24,
    (int32 & 0x00ff0000) >> 16,
    (int32 & 0x0000ff00) >> 8,
    (int32 & 0x000000ff) >> 0,
  );
}

function uint8ArrayToint32(binary, start = 0) {
  const bytes = binary.subarray(start, start + 4);
  let n = 0;
  for (const byte of bytes.values()) {
    n = (n << 8) | byte;
  }
  return n;
}

module.exports = {
  int32ToUint8Array: int32ToUint8Array,
  uint8ArrayToint32: uint8ArrayToint32,
};
