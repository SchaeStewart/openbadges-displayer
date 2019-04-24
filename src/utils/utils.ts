export async function unbakeBadge(badgeUrl: string): Promise<object> {
  const arrayToStr = (acc: string, val: number): string =>
    `${acc}${String.fromCharCode(val)}`;

  //TODO: fix types
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
    // TODO: error check and ensure last and first chunks are IHDR and IEND
    if (byteoffset >= buffer.byteLength) {
      return [];
    }

    const data = new DataView(buffer);
    const chunkLength = data.getUint32(byteoffset);
    const chunkType = new Uint8Array(buffer, byteoffset + 4, 4).reduce(
      arrayToStr,
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

  const getiTXt = chunks => {
    return chunks
      .filter(chunk => chunk.type === "iTXt")
      .map(chunk => {
        // TODO: clean this up. Make more functional. Handle compression flag
        let nullsEncountered = 0;
        let i = 0;
        let bytes = chunk.data;
        let keyword: string;
        let text: string;
        while (i < bytes.length) {
          if (bytes[i] == 0 && nullsEncountered == 0) {
            keyword = bytes.slice(0, i).reduce(arrayToStr, "");
            nullsEncountered++;
          } else if (bytes[i] == 0 && nullsEncountered == 4) {
            // Why is this 4? Because the compression flag is 0 for uncompressed which was probably screwwing with this logic?
            text = bytes.slice(i + 1).reduce(arrayToStr, "");
            break;
          } else if (bytes[i] == 0) {
            nullsEncountered++;
          }
          i++;
        }
        return { keyword, text };
      });
  };

  // const tEXt = chunks.filter(chunk => chunk.type === "tEXt");
  // const gettEXt = chunk => {
  //   let i = 0;
  //   const bytes = chunk.data;
  //   while (i < bytes.length) {
  //     if (bytes[i] == 0) {
  //       const keyword = bytes
  //         .slice(0, i)
  //         .reduce(arrayToStr, "");
  //       const text = bytes
  //         .slice(i + 1)
  //         .reduce(arrayToStr, "");
  //       return { keyword, text };
  //     }
  //     i++;
  //   }
  // };

  const imgBuffer = await fetch(
    `https://cors-anywhere.herokuapp.com/${badgeUrl}`
  ).then(res => res.arrayBuffer()); //TODO: don't use CORS anywhere
  ensurePNGsignature(imgBuffer, PNG_SIGNATURE);
  const chunks = getChunks(PNG_SIGNATURE.length, imgBuffer);
  return getiTXt(chunks)
    .filter(chunk => chunk.keyword === "openbadges")
    .map(chunk => JSON.parse(chunk.text))[0]; // TODO: in future ensure there is only ever 1 openbadge iTXt
}
