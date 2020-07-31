interface Chunk {
  data: Uint8Array;
  type: string;
}

interface iTXt {
  keyword: string;
  text: string;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const ensurePNGSignature = (
  buffer: ArrayBuffer,
  PNG_SIGNATURE: Array<number>
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

const arrayToStr = (acc: string, val: number): string =>
  `${acc}${String.fromCharCode(val)}`;

const getChunks = (byteoffset: number, buffer: ArrayBuffer): Array<Chunk> => {
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
    { data: chunkData, type: chunkType },
  ];
};

const getiTXt = (chunks: Array<Chunk>): Array<iTXt> => {
  return chunks
    .filter((chunk) => chunk.type === "iTXt")
    .map((chunk) =>
      chunk.data.reduce(
        // TODO: Handle compression flag: Section 4.2.3.3 http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
        (acc, byte, i, bytes) => {
          if (byte === 0 && acc.nullsEncountered === 0) {
            return {
              ...acc,
              nullsEncountered: acc.nullsEncountered + 1,
              keyword: bytes.slice(0, i).reduce(arrayToStr, ""),
            };
          } else if (byte === 0 && acc.nullsEncountered === 4) {
            bytes.slice(1); // a hack to force an early return
            return {
              ...acc,
              nullsEncountered: undefined,
              text: bytes.slice(i + 1).reduce(arrayToStr, ""),
            };
          } else if (byte === 0) {
            return {
              ...acc,
              nullsEncountered: acc.nullsEncountered + 1,
            };
          } else {
            return acc;
          }
        },
        { keyword: "", text: "", nullsEncountered: 0 }
      )
    );
};

export async function unbakeBadge(badgeUrl: string): Promise<object> {
  if (badgeUrl === "") {
    return {}
  }
  const imgBuffer = await fetch(`${badgeUrl}`).then((res) => res.arrayBuffer());
  if (imgBuffer.byteLength === 0) {
    return {}
  }
  ensurePNGSignature(imgBuffer, PNG_SIGNATURE);
  const chunks = getChunks(PNG_SIGNATURE.length, imgBuffer);
  const res = getiTXt(chunks)
    .filter((chunk) => chunk.keyword === "openbadges")
    .map((chunk) => JSON.parse(chunk.text)); // TODO: in future ensure there is only ever 1 openbadge iTXt
  return res[0]
}
