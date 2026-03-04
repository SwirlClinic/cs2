import * as net from "net";

const SERVERDATA_AUTH = 3;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_RESPONSE_VALUE = 0;

function encodePacket(id: number, type: number, body: string): Buffer {
  const bodyBuf = Buffer.from(body, "utf8");
  // size = 4 (id) + 4 (type) + body length + 1 (null terminator) + 1 (pad null)
  const size = 4 + 4 + bodyBuf.length + 1 + 1;
  const buf = Buffer.alloc(4 + size);
  buf.writeInt32LE(size, 0);
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  bodyBuf.copy(buf, 12);
  buf[12 + bodyBuf.length] = 0; // null terminator
  buf[12 + bodyBuf.length + 1] = 0; // pad null
  return buf;
}

function decodePacket(buf: Buffer): { id: number; type: number; body: string } {
  const id = buf.readInt32LE(4);
  const type = buf.readInt32LE(8);
  // Body starts at offset 12, ends 2 bytes before end (null terminator + pad)
  const body = buf.subarray(12, buf.length - 2).toString("utf8");
  return { id, type, body };
}

export async function rconSend(command: string): Promise<string> {
  const host = process.env.CS2_RCON_HOST || "cs2";
  const port = parseInt(process.env.CS2_RCON_PORT || "27015", 10);
  const password = process.env.CS2_RCON_PASSWORD || "";

  if (!password) {
    throw new Error("RCON password not configured");
  }

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buffer = Buffer.alloc(0);
    let authenticated = false;
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("RCON connection timed out"));
    }, 10000);

    socket.connect(port, host, () => {
      // Send auth packet
      socket.write(encodePacket(1, SERVERDATA_AUTH, password));
    });

    socket.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);

      // Process all complete packets in buffer
      while (buffer.length >= 4) {
        const size = buffer.readInt32LE(0);
        if (buffer.length < 4 + size) break; // incomplete packet

        const packetBuf = buffer.subarray(0, 4 + size);
        buffer = buffer.subarray(4 + size);
        const packet = decodePacket(packetBuf);

        if (!authenticated) {
          if (packet.type === SERVERDATA_AUTH_RESPONSE) {
            if (packet.id === -1) {
              clearTimeout(timeout);
              socket.destroy();
              reject(new Error("RCON authentication failed"));
              return;
            }
            authenticated = true;
            // Send command
            socket.write(encodePacket(2, SERVERDATA_EXECCOMMAND, command));
            // Send an empty packet as sentinel to detect end of response
            socket.write(encodePacket(3, SERVERDATA_RESPONSE_VALUE, ""));
          }
        } else {
          // After auth, collect response packets
          if (packet.id === 3) {
            // Sentinel response — we have all data
            clearTimeout(timeout);
            socket.destroy();
            resolve(responseBuf);
            return;
          }
          if (packet.id === 2 && packet.type === SERVERDATA_RESPONSE_VALUE) {
            responseBuf += packet.body;
          }
        }
      }
    });

    let responseBuf = "";

    socket.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`RCON connection error: ${err.message}`));
    });

    socket.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
