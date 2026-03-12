#!/usr/bin/env python3
"""Send an RCON command to reload the current map on the CS2 server."""
import socket
import struct
import os
import sys

RCON_HOST = os.environ.get("CS2_RCON_HOST", "127.0.0.1")
RCON_PORT = int(os.environ.get("CS2_RCON_PORT", "27015"))
RCON_PASS = os.environ.get("CS2_RCON_PASSWORD", "changeme_rcon_2024")

SERVERDATA_AUTH = 3
SERVERDATA_EXECCOMMAND = 2

def send_packet(sock, req_id, ptype, body):
    body_enc = body.encode("utf-8") + b"\x00\x00"
    size = 4 + 4 + len(body_enc)
    sock.sendall(struct.pack("<iii", size, req_id, ptype) + body_enc)

def recv_packet(sock):
    raw = sock.recv(4)
    if len(raw) < 4:
        return None
    size = struct.unpack("<i", raw)[0]
    data = b""
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            break
        data += chunk
    req_id = struct.unpack("<i", data[0:4])[0]
    ptype = struct.unpack("<i", data[4:8])[0]
    body = data[8:-2].decode("utf-8", errors="replace")
    return req_id, ptype, body

def rcon(command):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    sock.connect((RCON_HOST, RCON_PORT))
    # Auth
    send_packet(sock, 1, SERVERDATA_AUTH, RCON_PASS)
    # Read packets until we get the auth response (id=1)
    while True:
        pkt = recv_packet(sock)
        if pkt is None:
            print("RCON auth failed - no response")
            sock.close()
            sys.exit(1)
        if pkt[0] == -1:
            print("RCON auth failed - wrong password")
            sock.close()
            sys.exit(1)
        if pkt[0] == 1:
            break
    # Send command
    send_packet(sock, 2, SERVERDATA_EXECCOMMAND, command)
    resp = recv_packet(sock)
    sock.close()
    return resp[2] if resp else ""

if __name__ == "__main__":
    cmd = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "changelevel de_dust2"
    print(f"[map-reload] Sending: {cmd}")
    result = rcon(cmd)
    if result:
        print(f"[map-reload] Response: {result}")
    print("[map-reload] Done")
