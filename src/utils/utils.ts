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

  const getChunks = (byteoffset, buffer: ArrayBuffer): Array<any> => {
    if (byteoffset >= buffer.byteLength) {
      return [];
    }

    const data = new DataView(buffer);

    const chunkLength = data.getUint32(byteoffset);
    const chunkType = new Uint8Array(buffer, byteoffset + 4, 4).reduce(
      (acc, val) => `${acc}${String.fromCharCode(val)}`,
      ""
    );
    const chunkData = new Uint8Array(buffer, byteoffset + 8, chunkLength);

    // TODO: probably check the CRC?
    // Each chunk has 4 bytes for length, 4 bytes for type, 4 bytes for crc, and then X bytes for data
    const totalChunkLength = chunkLength + 12;
    return [
      ...getChunks(byteoffset + totalChunkLength, buffer),
      { data: chunkData, type: chunkType }
    ];
  };

  const imgBuffer = await fetch(
    `https://cors-anywhere.herokuapp.com/${badgeUrl}`
  ).then(res => res.arrayBuffer());

  ensurePNGsignature(imgBuffer, PNG_SIGNATURE);

  const chunks = getChunks(PNG_SIGNATURE.length, imgBuffer);
  // TODO: error check and ensure last and first chunks are IHDR and IEND

  const iTXt = chunks.filter(chunk => chunk.type === "iTXt");
  const getiTXt = chunk => {
    // TODO: clean this up. Make more functional. Handle compression flag
    let nullsEncountered = 0;
    let i = 0;
    let bytes = chunk.data;
    let keyword: string;
    let text: string;
    while (i < bytes.length) {
      if (bytes[i] == 0 && nullsEncountered == 0) {
        keyword = bytes
          .slice(0, i)
          .reduce((acc, val) => `${acc}${String.fromCharCode(val)}`, "");
        nullsEncountered++;
      } else if (bytes[i] == 0 && nullsEncountered == 4) {
        // Why is this 4? Because the compression flag is 0 for uncompressed which was probably screwwing with this logic?
        text = bytes
          .slice(i + 1)
          .reduce((acc, val) => `${acc}${String.fromCharCode(val)}`, "");
        break;
      } else if (bytes[i] == 0) {
        nullsEncountered++;
      }
      i++;
    }
    return { keyword, text };
  };

  const gettEXt = chunk => {
    let i = 0;
    const bytes = chunk.data;
    while (i < bytes.length) {
      if (bytes[i] == 0) {
        const keyword = bytes
          .slice(0, i)
          .reduce((acc, str) => `${acc}${String.fromCharCode(str)}`, "");
        const text = bytes
          .slice(i + 1)
          .reduce((acc, str) => `${acc}${String.fromCharCode(str)}`, "");
        return { keyword, text };
      }
      i++;
    }
  };

  const tEXt = chunks.filter(chunk => chunk.type === "tEXt");
  console.log(tEXt.map(gettEXt));

  console.log(iTXt.map(getiTXt));

  return "";
}
