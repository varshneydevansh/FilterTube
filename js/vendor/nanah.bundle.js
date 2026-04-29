(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // ../nanah/packages/core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    buildSasPhrase: () => buildSasPhrase,
    decryptUtf8Json: () => decryptUtf8Json,
    deriveSessionKeys: () => deriveSessionKeys,
    encryptUtf8Json: () => encryptUtf8Json,
    exportEcdhPublicKey: () => exportEcdhPublicKey,
    formatPairingCode: () => formatPairingCode,
    generateEcdhKeyPair: () => generateEcdhKeyPair,
    generatePairingCode: () => generatePairingCode,
    generateSessionId: () => generateSessionId,
    importPeerEcdhPublicKey: () => importPeerEcdhPublicKey,
    normalizePairingCode: () => normalizePairingCode
  });

  // ../nanah/packages/core/src/codes.ts
  var PAIRING_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  var PAIRING_ALPHABET_PATTERN = /[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g;
  function getSecureRandomInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("maxExclusive must be a positive integer");
    }
    const cryptoObject = globalThis.crypto;
    if (!cryptoObject?.getRandomValues) {
      throw new Error("Secure random source is not available");
    }
    const values = new Uint32Array(1);
    cryptoObject.getRandomValues(values);
    return values[0] % maxExclusive;
  }
  function generatePairingCode(length = 4) {
    if (!Number.isInteger(length) || length < 4 || length > 8) {
      throw new Error("Pairing code length must be between 4 and 8 characters");
    }
    let result = "";
    for (let index = 0; index < length; index += 1) {
      result += PAIRING_ALPHABET[getSecureRandomInt(PAIRING_ALPHABET.length)];
    }
    return result;
  }
  function normalizePairingCode(input) {
    return String(input || "").toUpperCase().replace(PAIRING_ALPHABET_PATTERN, "");
  }
  function formatPairingCode(input) {
    const normalized = normalizePairingCode(input);
    if (normalized.length <= 4) return normalized;
    return normalized.match(/.{1,4}/g)?.join("-") || normalized;
  }
  function generateSessionId() {
    const cryptoObject = globalThis.crypto;
    if (!cryptoObject?.randomUUID) {
      throw new Error("crypto.randomUUID is not available");
    }
    return cryptoObject.randomUUID();
  }

  // ../nanah/packages/core/src/crypto.ts
  var DEFAULT_SAS_WORDS = [
    "amber",
    "apple",
    "atlas",
    "bamboo",
    "blue",
    "cedar",
    "cinder",
    "cobalt",
    "delta",
    "ember",
    "falcon",
    "forest",
    "glow",
    "harbor",
    "iris",
    "jungle",
    "lagoon",
    "lilac",
    "maple",
    "meadow",
    "nova",
    "oasis",
    "olive",
    "orchid",
    "pearl",
    "pine",
    "quartz",
    "raven",
    "river",
    "saffron",
    "sierra",
    "silver",
    "stone",
    "sun",
    "topaz",
    "velvet",
    "willow",
    "yarrow",
    "zephyr"
  ];
  async function generateEcdhKeyPair() {
    return crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256"
      },
      true,
      ["deriveBits"]
    );
  }
  async function exportEcdhPublicKey(publicKey) {
    return crypto.subtle.exportKey("jwk", publicKey);
  }
  async function importPeerEcdhPublicKey(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDH",
        namedCurve: "P-256"
      },
      false,
      []
    );
  }
  async function deriveSessionKeys(privateKey, peerPublicKey, directionSalt) {
    const sharedBits = await crypto.subtle.deriveBits(
      {
        name: "ECDH",
        public: peerPublicKey
      },
      privateKey,
      256
    );
    const salt = new TextEncoder().encode(`nanah:${directionSalt}`);
    const infoChannel = new TextEncoder().encode("nanah:channel");
    const infoSas = new TextEncoder().encode("nanah:sas");
    const baseKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey", "deriveBits"]);
    const channelKey = await crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info: infoChannel },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    const sasBits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: infoSas },
      baseKey,
      64
    );
    return {
      sendKey: channelKey,
      receiveKey: channelKey,
      sasBytes: new Uint8Array(sasBits)
    };
  }
  function buildSasPhrase(input) {
    const bytes = Array.from(input || []);
    if (bytes.length === 0) return "pending-pending-0000";
    const wordA = DEFAULT_SAS_WORDS[bytes[0] % DEFAULT_SAS_WORDS.length];
    const wordB = DEFAULT_SAS_WORDS[bytes[1] % DEFAULT_SAS_WORDS.length];
    const number = ((bytes[2] || 0) << 8 | (bytes[3] || 0)) % 1e4;
    return `${wordA}-${wordB}-${String(number).padStart(4, "0")}`;
  }
  function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  async function encryptUtf8Json(key, value) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(value);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plaintext
    );
    return {
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext))
    };
  }
  async function decryptUtf8Json(key, payload) {
    const iv = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  }

  // ../nanah/packages/client/src/index.ts
  var src_exports2 = {};
  __export(src_exports2, {
    DEFAULT_NANAH_SIGNALING_URL: () => DEFAULT_NANAH_SIGNALING_URL,
    NanahClient: () => NanahClient,
    WebRtcDataChannelTransport: () => WebRtcDataChannelTransport,
    resolveNanahSignalingUrl: () => resolveNanahSignalingUrl
  });

  // ../nanah/packages/core/dist/codes.js
  var PAIRING_ALPHABET2 = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function getSecureRandomInt2(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("maxExclusive must be a positive integer");
    }
    const cryptoObject = globalThis.crypto;
    if (!cryptoObject?.getRandomValues) {
      throw new Error("Secure random source is not available");
    }
    const values = new Uint32Array(1);
    cryptoObject.getRandomValues(values);
    return values[0] % maxExclusive;
  }
  function generatePairingCode2(length = 4) {
    if (!Number.isInteger(length) || length < 4 || length > 8) {
      throw new Error("Pairing code length must be between 4 and 8 characters");
    }
    let result = "";
    for (let index = 0; index < length; index += 1) {
      result += PAIRING_ALPHABET2[getSecureRandomInt2(PAIRING_ALPHABET2.length)];
    }
    return result;
  }
  function generateSessionId2() {
    const cryptoObject = globalThis.crypto;
    if (!cryptoObject?.randomUUID) {
      throw new Error("crypto.randomUUID is not available");
    }
    return cryptoObject.randomUUID();
  }

  // ../nanah/packages/core/dist/crypto.js
  var DEFAULT_SAS_WORDS2 = [
    "amber",
    "apple",
    "atlas",
    "bamboo",
    "blue",
    "cedar",
    "cinder",
    "cobalt",
    "delta",
    "ember",
    "falcon",
    "forest",
    "glow",
    "harbor",
    "iris",
    "jungle",
    "lagoon",
    "lilac",
    "maple",
    "meadow",
    "nova",
    "oasis",
    "olive",
    "orchid",
    "pearl",
    "pine",
    "quartz",
    "raven",
    "river",
    "saffron",
    "sierra",
    "silver",
    "stone",
    "sun",
    "topaz",
    "velvet",
    "willow",
    "yarrow",
    "zephyr"
  ];
  async function generateEcdhKeyPair2() {
    return crypto.subtle.generateKey({
      name: "ECDH",
      namedCurve: "P-256"
    }, true, ["deriveBits"]);
  }
  async function exportEcdhPublicKey2(publicKey) {
    return crypto.subtle.exportKey("jwk", publicKey);
  }
  async function importPeerEcdhPublicKey2(jwk) {
    return crypto.subtle.importKey("jwk", jwk, {
      name: "ECDH",
      namedCurve: "P-256"
    }, false, []);
  }
  async function deriveSessionKeys2(privateKey, peerPublicKey, directionSalt) {
    const sharedBits = await crypto.subtle.deriveBits({
      name: "ECDH",
      public: peerPublicKey
    }, privateKey, 256);
    const salt = new TextEncoder().encode(`nanah:${directionSalt}`);
    const infoChannel = new TextEncoder().encode("nanah:channel");
    const infoSas = new TextEncoder().encode("nanah:sas");
    const baseKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey", "deriveBits"]);
    const channelKey = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: infoChannel }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const sasBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: infoSas }, baseKey, 64);
    return {
      sendKey: channelKey,
      receiveKey: channelKey,
      sasBytes: new Uint8Array(sasBits)
    };
  }
  function buildSasPhrase2(input) {
    const bytes = Array.from(input || []);
    if (bytes.length === 0)
      return "pending-pending-0000";
    const wordA = DEFAULT_SAS_WORDS2[bytes[0] % DEFAULT_SAS_WORDS2.length];
    const wordB = DEFAULT_SAS_WORDS2[bytes[1] % DEFAULT_SAS_WORDS2.length];
    const number = ((bytes[2] || 0) << 8 | (bytes[3] || 0)) % 1e4;
    return `${wordA}-${wordB}-${String(number).padStart(4, "0")}`;
  }
  function bytesToBase642(bytes) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
  function base64ToBytes2(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  async function encryptUtf8Json2(key, value) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(value);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    return {
      iv: bytesToBase642(iv),
      ciphertext: bytesToBase642(new Uint8Array(ciphertext))
    };
  }
  async function decryptUtf8Json2(key, payload) {
    const iv = base64ToBytes2(payload.iv);
    const ciphertext = base64ToBytes2(payload.ciphertext);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  }

  // ../nanah/packages/client/src/config.ts
  var DEFAULT_NANAH_SIGNALING_URL = "wss://nanah-signaling.varshney-devansh614.workers.dev/ws";
  function resolveNanahSignalingUrl(explicitUrl) {
    const value = String(explicitUrl || "").trim();
    return value || DEFAULT_NANAH_SIGNALING_URL;
  }

  // ../nanah/packages/client/src/NanahClient.ts
  var NanahClient = class {
    constructor(options) {
      this.options = options;
      this.options.signalingUrl = resolveNanahSignalingUrl(options.signalingUrl);
      this.transport = options.transport;
    }
    transport;
    listeners = /* @__PURE__ */ new Map();
    stage = "idle";
    on(event, listener) {
      const bucket = this.listeners.get(event) || /* @__PURE__ */ new Set();
      bucket.add(listener);
      this.listeners.set(event, bucket);
      return () => {
        bucket.delete(listener);
        if (bucket.size === 0) {
          this.listeners.delete(event);
        }
      };
    }
    async host() {
      const result = {
        code: generatePairingCode2(4),
        sessionId: generateSessionId2()
      };
      this.setStage("hosting");
      this.emit("code", result);
      await this.transport.host({
        ...result,
        device: this.options.device
      }, this.buildHooks());
      return result;
    }
    async join(code) {
      const session = {
        code,
        device: this.options.device
      };
      this.setStage("joining");
      const result = await this.transport.join(session, this.buildHooks()) || { code };
      return result;
    }
    async send(data) {
      await this.transport.send(data);
    }
    async sendAppSync(input) {
      await this.send({
        t: "app_sync",
        ...input,
        app: input.app || this.options.app || this.options.device?.app || "generic"
      });
    }
    async proposeControl(input) {
      await this.send({
        t: "control_proposal",
        ...input,
        app: input.app || this.options.app || this.options.device?.app || "generic"
      });
    }
    async confirmSas() {
      if (typeof this.transport.confirmSas === "function") {
        await this.transport.confirmSas();
      }
    }
    async close() {
      await this.transport.close();
      this.setStage("closed");
      this.emit("closed", void 0);
    }
    getStage() {
      return this.stage;
    }
    buildHooks() {
      return {
        onStageChange: (stage) => {
          this.setStage(stage);
        },
        onSas: (payload) => {
          this.emit("sas", payload);
        },
        onConnected: () => {
          this.setStage("connected");
          this.emit("connected", void 0);
        },
        onData: (envelope) => {
          this.emit("data", envelope);
        },
        onProgress: (progress) => {
          this.emit("progress", progress);
        },
        onClosed: () => {
          this.setStage("closed");
          this.emit("closed", void 0);
        },
        onError: (error) => {
          this.setStage("errored");
          this.emit("error", error);
        }
      };
    }
    emit(event, payload) {
      const bucket = this.listeners.get(event);
      if (!bucket || bucket.size === 0) return;
      for (const listener of bucket) {
        listener(payload);
      }
    }
    setStage(stage) {
      if (this.stage === stage) return;
      this.stage = stage;
      this.emit("stage", stage);
    }
  };

  // ../nanah/packages/client/src/transports/WebRtcDataChannelTransport.ts
  var MAX_DATA_CHANNEL_MESSAGE_CHARS = 16e3;
  var WebRtcDataChannelTransport = class {
    constructor(options = {}) {
      this.options = options;
      this.options.signalingUrl = resolveNanahSignalingUrl(this.options.signalingUrl);
    }
    socket = null;
    peerConnection = null;
    dataChannel = null;
    hooks = null;
    sessionId = "";
    code = "";
    mode = null;
    joinResolve = null;
    pendingIceCandidates = [];
    localEcdhKeys = null;
    sendKey = null;
    receiveKey = null;
    localSasPhrase = "";
    remoteSasPhrase = "";
    sasConfirmed = false;
    rtcConnected = false;
    incomingChunks = /* @__PURE__ */ new Map();
    async host(session, hooks) {
      this.mode = "host";
      this.sessionId = session.sessionId;
      this.code = session.code;
      this.hooks = hooks;
      hooks.onStageChange("signaling");
      this.localEcdhKeys = await generateEcdhKeyPair2();
      const socket = await this.connectSocket();
      this.socket = socket;
      this.peerConnection = this.createPeerConnection();
      this.dataChannel = this.attachDataChannel(this.peerConnection.createDataChannel("nanah"));
      this.sendSignal({
        type: "host_session",
        code: session.code,
        sessionId: session.sessionId,
        deviceId: session.device?.deviceId
      });
    }
    async join(session, hooks) {
      this.mode = "join";
      this.code = session.code;
      this.hooks = hooks;
      hooks.onStageChange("signaling");
      this.localEcdhKeys = await generateEcdhKeyPair2();
      const socket = await this.connectSocket();
      this.socket = socket;
      this.peerConnection = this.createPeerConnection();
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = this.attachDataChannel(event.channel);
      };
      return new Promise((resolve) => {
        this.joinResolve = resolve;
        this.sendSignal({
          type: "join_session",
          code: session.code,
          deviceId: session.device?.deviceId
        });
      });
    }
    async send(envelope) {
      if (!this.dataChannel || this.dataChannel.readyState !== "open") {
        throw new Error("Nanah data channel is not open");
      }
      if (!this.sasConfirmed || !this.sendKey) {
        throw new Error("Nanah SAS has not been confirmed yet");
      }
      const encrypted = await encryptUtf8Json2(this.sendKey, JSON.stringify(envelope));
      const serialized = JSON.stringify(encrypted);
      this.sendSerializedPayload(serialized);
    }
    async close() {
      try {
        this.dataChannel?.close();
      } catch (error) {
      }
      try {
        this.peerConnection?.close();
      } catch (error) {
      }
      try {
        this.socket?.close();
      } catch (error) {
      }
      this.dataChannel = null;
      this.peerConnection = null;
      this.socket = null;
    }
    async confirmSas() {
      this.sasConfirmed = true;
      if (this.rtcConnected) {
        this.hooks?.onConnected();
      }
    }
    async connectSocket() {
      return new Promise((resolve, reject) => {
        const signalingUrl = resolveNanahSignalingUrl(this.options.signalingUrl);
        const socket = new WebSocket(signalingUrl);
        socket.addEventListener("open", () => resolve(socket), { once: true });
        socket.addEventListener("error", () => reject(new Error("Failed to connect to Nanah signaling relay")), { once: true });
        socket.addEventListener("message", (event) => {
          this.handleSocketMessage(event.data);
        });
        socket.addEventListener("close", () => {
          this.socket = null;
          const dataChannelOpen = this.dataChannel?.readyState === "open";
          if (!this.rtcConnected && !dataChannelOpen) {
            this.hooks?.onClosed();
          }
        });
      });
    }
    createPeerConnection() {
      const connection = new RTCPeerConnection({
        iceServers: [
          {
            urls: this.options.stunUrls?.length ? this.options.stunUrls : ["stun:stun.l.google.com:19302"]
          }
        ]
      });
      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        this.sendSignal({
          type: "signal",
          sessionId: this.sessionId,
          payload: {
            type: "ice",
            candidate: event.candidate.toJSON()
          }
        });
      };
      connection.onconnectionstatechange = () => {
        if (connection.connectionState === "connected") {
          this.rtcConnected = true;
          this.maybeEmitReadyState();
        }
        if (connection.connectionState === "failed") {
          this.hooks?.onError(new Error("WebRTC connection failed"));
        }
      };
      return connection;
    }
    attachDataChannel(channel) {
      channel.addEventListener("open", () => {
        this.rtcConnected = true;
        this.maybeEmitReadyState();
      });
      channel.addEventListener("message", (event) => {
        void this.handleDataChannelMessage(event.data);
      });
      channel.addEventListener("close", () => {
        this.hooks?.onClosed();
      });
      channel.addEventListener("error", () => {
        this.hooks?.onError(new Error("Nanah data channel error"));
      });
      return channel;
    }
    sendSerializedPayload(serialized) {
      if (!this.dataChannel || this.dataChannel.readyState !== "open") {
        throw new Error("Nanah data channel is not open");
      }
      if (serialized.length <= MAX_DATA_CHANNEL_MESSAGE_CHARS) {
        this.dataChannel.send(serialized);
        return;
      }
      const total = Math.ceil(serialized.length / MAX_DATA_CHANNEL_MESSAGE_CHARS);
      const chunkId = `chunk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      for (let idx = 0; idx < total; idx += 1) {
        const start = idx * MAX_DATA_CHANNEL_MESSAGE_CHARS;
        const end = start + MAX_DATA_CHANNEL_MESSAGE_CHARS;
        const frame = {
          __nanahChunk: true,
          id: chunkId,
          idx,
          total,
          payload: serialized.slice(start, end)
        };
        this.dataChannel.send(JSON.stringify(frame));
      }
    }
    async handleSocketMessage(raw) {
      let message = null;
      try {
        message = JSON.parse(String(raw));
      } catch (error) {
        this.hooks?.onError(new Error("Invalid signaling message"));
        return;
      }
      if (!message) return;
      if (message.type === "session_ready") {
        if (message.sessionId) {
          this.sessionId = message.sessionId;
        }
        if (this.mode === "join") {
          await this.sendLocalPublicKey();
        }
        if (this.joinResolve) {
          this.joinResolve({ code: message.code || this.code, sessionId: message.sessionId });
          this.joinResolve = null;
        }
        return;
      }
      if (message.type === "peer_joined") {
        await this.sendLocalPublicKey();
        await this.beginOfferFlow();
        return;
      }
      if (message.type === "signal") {
        await this.applySignalPayload(message.payload);
        return;
      }
      if (message.type === "error") {
        const error = (() => {
          switch (message.error) {
            case "same_device_join":
              return new Error("This device is already hosting that pairing code. Join from a different browser or device.");
            case "session_occupied":
              return new Error("This pairing code is already connected to another device. Start a fresh session if needed.");
            default:
              return new Error(message.error);
          }
        })();
        this.hooks?.onError(error);
      }
    }
    async beginOfferFlow() {
      if (!this.peerConnection || this.mode !== "host") return;
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.sendSignal({
        type: "signal",
        sessionId: this.sessionId,
        payload: {
          type: "offer",
          sdp: offer
        }
      });
    }
    async applySignalPayload(payload) {
      if (!this.peerConnection) return;
      if (payload.type === "offer") {
        await this.peerConnection.setRemoteDescription(payload.sdp);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.sendSignal({
          type: "signal",
          sessionId: this.sessionId,
          payload: {
            type: "answer",
            sdp: answer
          }
        });
        while (this.pendingIceCandidates.length > 0) {
          const candidate = this.pendingIceCandidates.shift();
          if (candidate) {
            await this.peerConnection.addIceCandidate(candidate);
          }
        }
        return;
      }
      if (payload.type === "answer") {
        await this.peerConnection.setRemoteDescription(payload.sdp);
        return;
      }
      if (payload.type === "ice") {
        if (this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(payload.candidate);
        } else {
          this.pendingIceCandidates.push(payload.candidate);
        }
        return;
      }
      if (payload.type === "e2ee_pubkey") {
        if (!this.localEcdhKeys) {
          throw new Error("Local ECDH keys are missing");
        }
        const peerPublicKey = await importPeerEcdhPublicKey2(payload.key);
        const derived = await deriveSessionKeys2(
          this.localEcdhKeys.privateKey,
          peerPublicKey,
          this.sessionId || this.code
        );
        this.sendKey = derived.sendKey;
        this.receiveKey = derived.receiveKey;
        this.localSasPhrase = buildSasPhrase2(derived.sasBytes);
        this.hooks?.onStageChange("awaiting_sas");
        this.hooks?.onSas({ phrase: this.localSasPhrase });
        this.sendSignal({
          type: "signal",
          sessionId: this.sessionId,
          payload: {
            type: "sas_ready",
            phrase: this.localSasPhrase
          }
        });
        return;
      }
      if (payload.type === "sas_ready") {
        this.remoteSasPhrase = payload.phrase;
        if (this.localSasPhrase && this.remoteSasPhrase && this.localSasPhrase !== this.remoteSasPhrase) {
          this.hooks?.onError(new Error("SAS mismatch detected"));
          return;
        }
        if (this.localSasPhrase) {
          this.hooks?.onStageChange("awaiting_sas");
          this.hooks?.onSas({ phrase: this.localSasPhrase });
        }
      }
    }
    sendSignal(message) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        throw new Error("Nanah signaling socket is not open");
      }
      this.socket.send(JSON.stringify(message));
    }
    async sendLocalPublicKey() {
      if (!this.localEcdhKeys) return;
      const publicKey = await exportEcdhPublicKey2(this.localEcdhKeys.publicKey);
      this.sendSignal({
        type: "signal",
        sessionId: this.sessionId,
        payload: {
          type: "e2ee_pubkey",
          key: publicKey
        }
      });
    }
    async handleDataChannelMessage(raw) {
      const serialized = String(raw);
      if (this.tryHandleChunkFrame(serialized)) {
        return;
      }
      await this.handleEncryptedEnvelope(serialized);
    }
    tryHandleChunkFrame(serialized) {
      let parsed = null;
      try {
        parsed = JSON.parse(serialized);
      } catch {
        return false;
      }
      if (!parsed || parsed.__nanahChunk !== true || !parsed.id || typeof parsed.idx !== "number" || typeof parsed.total !== "number") {
        return false;
      }
      const total = Math.max(0, parsed.total);
      const idx = Math.max(0, parsed.idx);
      if (total <= 0 || idx >= total) {
        this.hooks?.onError(new Error("Received invalid Nanah chunk frame"));
        return true;
      }
      const bucket = this.incomingChunks.get(parsed.id) || new Array(total).fill("");
      bucket[idx] = typeof parsed.payload === "string" ? parsed.payload : "";
      this.incomingChunks.set(parsed.id, bucket);
      const complete = bucket.every((part) => typeof part === "string" && part.length > 0);
      if (!complete) return true;
      this.incomingChunks.delete(parsed.id);
      void this.handleEncryptedEnvelope(bucket.join(""));
      return true;
    }
    async handleEncryptedEnvelope(serialized) {
      try {
        if (!this.receiveKey) {
          throw new Error("Nanah receive key is not ready");
        }
        const encrypted = JSON.parse(serialized);
        const decrypted = await decryptUtf8Json2(this.receiveKey, encrypted);
        const parsed = JSON.parse(decrypted);
        this.hooks?.onData(parsed);
      } catch (error) {
        this.hooks?.onError(error);
      }
    }
    maybeEmitReadyState() {
      if (this.rtcConnected && this.sasConfirmed) {
        this.hooks?.onStageChange("connected");
        this.hooks?.onConnected();
      }
    }
  };

  // nanah-entry.js
  window.FilterTubeNanah = {
    ...src_exports,
    ...src_exports2
  };
})();
