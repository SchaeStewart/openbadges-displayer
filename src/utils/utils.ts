export function format(first: string, middle: string, last: string): string {
  return (
    (first || "") + (middle ? ` ${middle}` : "") + (last ? ` ${last}` : "")
  );
}

export async function unbakeBadge(badgeUrl: string): Promise<string> {
  const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
  const ensurePNGsignature = (
    buffer: ArrayBuffer,
    PNG_SIGNATURE: Array<Number>
  ): void => {
    const bytes = new Uint8Array(buffer, 0, PNG_SIGNATURE.length);
    let i = 0;
    while (i < PNG_SIGNATURE.length) {
      if (bytes[i] !== PNG_SIGNATURE[i]) {
        throw new Error("PNG signature mismatch at byte " + i);
      }
      i++;
    }
  };

  const getChunks = (byteoffset, buffer: ArrayBuffer) => {
    if (byteoffset >= buffer.byteLength) {
      return;
    }

    const data = new DataView(buffer);

    const chunkLength = data.getUint32(byteoffset);
    const chunkType = new Uint8Array(buffer, byteoffset + 4, 4).reduce(
      (acc, val) => `${acc}${String.fromCharCode(val)}`,
      ""
    );
    const chunkData = new Uint8Array(buffer, byteoffset, chunkLength);

    // TODO: probably check the CRC?

    console.log({ chunkLength, chunkType, chunkData });

    // Each chunk has 4 bytes for length, 4 bytes for type, 4 bytes for crc, and then X bytes for data
    const totalChunkLength = chunkLength + 12;
    getChunks(byteoffset + totalChunkLength, buffer);
  };

  const imgBuffer = await fetch(
    `https://cors-anywhere.herokuapp.com/${badgeUrl}`
  ).then(res => res.arrayBuffer());

  ensurePNGsignature(imgBuffer, PNG_SIGNATURE);

  getChunks(PNG_SIGNATURE.length, imgBuffer);

  return "";
}
