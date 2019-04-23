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

  const reverse = (x: any, n: any): any => {
    let b = 0;
    while (--n >= 0) {
      b <<= 1;
      b |= x & 1;
      x >>>= 1;
    }
    return b;
    // let b = 0;
    // while (n) {
    //   b = b * 2 + (x % 2);
    //   x /= 2;
    //   x -= x % 1;
    //   n--;
    // }
    // return b;
  };

  const crc32 = (s: any): any => {
    s = String(s);
    let polynomial = arguments.length < 2 ? 0x04c11db7 : arguments[1] >>> 0;
    let initialValue = arguments.length < 3 ? 0xffffffff : arguments[2] >>> 0;
    let finalXORValue = arguments.length < 4 ? 0xffffffff : arguments[3] >>> 0;
    let table = new Array(256);

    let i = -1;
    while (++i < 256) {
      let g = reverse(i, 32);
      let j = -1;
      while (++j < 8) {
        g = ((g << 1) ^ (((g >>> 31) & 1) * polynomial)) >>> 0;
      }
      table[i] = reverse(g, 32);
    }

    let crc = initialValue;
    let length = s.length;
    let k = -1;
    while (++k < length) {
      let c = s.charCodeAt(k);
      if (c > 255) {
        throw new RangeError();
      }
      let index = (crc & 255) ^ c;
      crc = ((crc >>> 8) ^ table[index]) >>> 0;
    }
    return (crc ^ finalXORValue) >>> 0;
  };

  const arrayToStr = (arr: Uint8Array): String =>
    [].map.call(arr, charCode => String.fromCharCode(charCode)).join("");

  const readTextChunk = (bytes: Uint8Array, textChunks: object) => {
    let keyword, text;
    let i = 0;
    while (i < bytes.length) {
      if (bytes[i] == 0) {
        keyword = arrayToStr([].slice.call(bytes, 0, i));
        text = arrayToStr([].slice.call(bytes, i + 1));
        break;
      }
      i++;
    }
    if (!keyword) {
      throw new Error("malformed tEXt chunk");
    }

    textChunks[keyword] = text;
  };

  const readiTxtChunk = (bytes: Uint8Array, textChunks: object) => {
    let nullsEncountered = 0;
    let i = 0;
    let text: String;
    let keyword;

    while (i < bytes.length) {
      if (bytes[i] == 0 && nullsEncountered == 0) {
        keyword = arrayToStr([].slice.call(bytes, 0, i));
        nullsEncountered++;
      } else if (bytes[i] == 0 && nullsEncountered == 3) {
        text = arrayToStr([].slice.call(bytes, i + 1));
        break;
      } else if (bytes[i] == 0) {
        nullsEncountered++;
      }
      i++;
    }

    if (!keyword) {
      throw new Error("malformed iTxt chunk");
    }

    textChunks[keyword] = text;
  };

  // https://github.com/curlee/png-baker.js/blob/gh-pages/src/PNGBaker.litcoffee

  const readNextChunk = (
    buffer: ArrayBuffer,
    byteOffset: number,
    textChunks: object,
    chunks: Array<object>
  ) => {
    let i = byteOffset;
    const data = new DataView(buffer);

    const chunkLength = data.getUint32(i);
    i += 4;

    const crcData = new Uint8Array(buffer, i, chunkLength + 4);
    const ourCRC = crc32(crcData);

    const chunkType = arrayToStr(new Uint8Array(buffer, i, 4));

    const chunkBytes = new Uint8Array(buffer, i, chunkLength);
    i += chunkLength;

    const chunkCRC = data.getUint32(i);
    i += 4;

    if (chunkCRC != ourCRC) {
      throw new Error("CRC mismatch for chunk type " + chunkType);
    }

    if (chunkType == "tEXt") {
      readTextChunk(chunkBytes, textChunks);
    } else if (chunkType == "iTXt") {
      readiTxtChunk(chunkBytes, textChunks);
    } else {
      chunks.push({
        type: chunkType,
        data: chunkBytes
      });
    }

    return i - byteOffset;
  };

  // Is mutated as a side effect by readTextChunk and readItxtChunk(?)
  const textChunks = {};
  const chunks = []; // Also mutated

  const imgBuffer = await fetch(
    `https://cors-anywhere.herokuapp.com/${badgeUrl}`
  ).then(res => res.arrayBuffer());

  ensurePNGsignature(imgBuffer, PNG_SIGNATURE);

  let i = PNG_SIGNATURE.length;
  while (i < imgBuffer.byteLength) {
    i += readNextChunk(imgBuffer, i, textChunks, chunks);
  }

  console.log({ textChunks, chunks });

  return "";
}
