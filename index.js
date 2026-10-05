import { Agent, request, fetch, FormData } from "undici";
import validator from "validator";
import { readFile } from "node:fs/promises";
import path from "node:path";


let agent = null;
let config = {
  config_set: false,
};

const NOT_SUPPORTED = "Server version 7.4 or newer is not supported *yet*.";

function validateServerUrl(serverUrl, noQuery) {
  if (!serverUrl) {
    console.error("validateServerUrl: Missing serverUrl");
    return false;
  }
  if (!validator.isURL(serverUrl, {
    protocols: ["http", "https"],
    require_protocol: true
  })) {
    if (config.debug) { console.error("URL is Invalid or does not include the http or https schema.") }
    return false;
  }

  const url = new URL(serverUrl);

  if (noQuery && (url.search || url.hash)) {
    if (config.debug) { console.error("URL includes Query-Parameter.") }
    return false;
  }

  return true;
}

function configure({
  serverUrl,
  isServerVersionBelow74 = false,
  deprecatedTLS = false,
  shutup = false,
  debug = false
}) {
  if (!serverUrl) {
    console.error("Server address is missing");
    return;
  }

  // Erst pruefen, dann config setzen
  if (!validateServerUrl(serverUrl, true)) {
    console.error("Invalid server URL.");
    return;
  }

  if (new URL(serverUrl).protocol === "http:") {
    console.warn("Using HTTP instead of HTTPS is not recommended.");
  }

  config = {
    config_set: true,
    serverUrl: serverUrl,
    isServerVersionBelow74: isServerVersionBelow74,
    deprecatedTLS: deprecatedTLS,
    shutup: shutup,
    debug: debug,
  }

  if (deprecatedTLS) {
    console.warn("Using a deprecated TLS version is not recommended");

    agent = new Agent({
      connect: {
        minVersion: "TLSv1",
        maxVersion: "TLSv1.3"
      }
    });
  } else {
    agent = new Agent({
      connect: {
        maxVersion: "TLSv1.3"
      }
    });
  }
  if (!config.shutup) console.log("Linux Muster Library has been successfully configured.")
}

async function login(username, password) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!username || !password) { console.error("Not all required arguments are provided."); return null; }

  let XApiKey = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, headers, body } = await request((config.serverUrl + "/api/core/auth"), {
      method: 'POST',
      dispatcher: agent,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password,
        mode: "normal"
      })
    });

    // Body lesen/verwerfen, sonst bleibt die Verbindung offen
    await body.dump();

    // Cookie bewusst NICHT loggen
    if (config.debug) { console.log((config.serverUrl + "/api/core/auth"), statusCode) }

    if (statusCode >= 400) {
      console.error("Login failed. Status code:", statusCode);
      return null;
    }

    // set-cookie kann ein String, ein Array oder gar nicht da sein
    let cookie = headers['set-cookie'];
    if (Array.isArray(cookie)) {
      cookie = cookie.find((c) => c.startsWith("session="));
    }
    if (!cookie) {
      console.error("Login failed. No session cookie received.");
      return null;
    }

    XApiKey = cookie.match(/^session=([^;]+)/)?.[1] || null;
  } else {
    console.error(NOT_SUPPORTED);
  }

  return XApiKey;
}

async function getIdentity(XApiKey) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let identity = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/core/identity"), {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log((config.serverUrl + "/api/core/identity"), statusCode); }
    identity = (await body.json()).identity;
  } else {
    console.error(NOT_SUPPORTED);
  }

  return identity;
}

async function getQuota(XApiKey, username) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let quota = null;

  if (config.isServerVersionBelow74) {
    const url = config.serverUrl + "/api/lmn/quota/user/" + encodeURIComponent(username);
    const { statusCode, body } = await request(url, {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log(url, statusCode); }
    quota = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return quota;
}

async function getDisplayOptions(XApiKey) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let displayOptions = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/lmn/display_options"), {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log((config.serverUrl + "/api/lmn/display_options"), statusCode); }
    displayOptions = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return displayOptions;
}

async function getUICustomFields(XApiKey, username) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let UICustomFields = null;

  if (config.isServerVersionBelow74) {
    const url = config.serverUrl + "/api/lmn/users/" + encodeURIComponent(username) + "/customfields";
    const { statusCode, body } = await request(url, {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log(url, statusCode); }
    UICustomFields = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return UICustomFields;
}

async function getSetupStatus(XApiKey) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let setupStatus = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/lmn/setup-wizard/is-configured"), {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log((config.serverUrl + "/api/lmn/setup-wizard/is-configured"), statusCode); }
    setupStatus = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return setupStatus;
}

async function getSessionTime(XApiKey) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let sessionTime = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/core/session-time"), {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log((config.serverUrl + "/api/core/session-time"), statusCode); }
    sessionTime = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return sessionTime;
}

async function getShares(XApiKey, username) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey) { console.error("Not all required arguments are provided."); return null; }

  let smbShares = null;

  if (config.isServerVersionBelow74) {
    const url = config.serverUrl + "/api/lmn/smbclient/shares/" + encodeURIComponent(username);
    const { statusCode, body } = await request(url, {
      method: 'GET',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      }
    });
    if (config.debug) { console.log(url, statusCode); }
    smbShares = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return smbShares;
}

async function list_dir(XApiKey, smbPath) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey || !smbPath) { console.error("Not all required arguments are provided."); return null; }

  let ls = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/lmn/smbclient/list"), {
      method: 'POST',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      },
      body: JSON.stringify({ path: smbPath })
    });
    if (config.debug) { console.log((config.serverUrl + "/api/lmn/smbclient/list"), statusCode); }
    ls = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return ls;
}

async function uploadFile(
  XApiKey,
  filePath,
  smbPath,
  chunkSize = 1024 * 1024
) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey || !filePath || !smbPath) { console.error("Not all required arguments are provided."); return null; }

  if (!config.isServerVersionBelow74) {
    console.error(NOT_SUPPORTED);
    return null;
  }

  const filename = path.basename(filePath);
  const file = await readFile(filePath);
  const totalSize = file.length;

  const flowIdentifier =
    `${totalSize}-${filename.replace(/[^a-zA-Z0-9]/g, "")}`;

  const totalChunks = Math.ceil(totalSize / chunkSize);

  for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
    const start = (chunkNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const chunk = file.subarray(start, end);

    const form = new FormData();

    form.append("flowChunkNumber", String(chunkNumber));
    form.append("flowChunkSize", String(chunkSize));
    form.append("flowCurrentChunkSize", String(chunk.length));
    form.append("flowTotalSize", String(totalSize));
    form.append("flowIdentifier", flowIdentifier);
    form.append("flowFilename", filename);
    form.append("flowRelativePath", filename);
    form.append("flowTotalChunks", String(totalChunks));
    form.append("file", new Blob([chunk]), filename);

    const response = await fetch(
      config.serverUrl + "/api/lmn/smbclient/upload",
      {
        method: "POST",
        dispatcher: agent,
        headers: {
          "Cookie": `session=${XApiKey}`
        },
        body: form
      }
    );

    if (!response.ok) {
      throw new Error(
        `Upload failed (${chunkNumber}/${totalChunks}): ${response.status}`
      );
    }
  }

  const finishResponse = await fetch(
    config.serverUrl + "/api/lmn/smbclient/finish-upload",
    {
      method: "POST",
      dispatcher: agent,
      headers: {
        "Content-Type": "application/json",
        "Cookie": `session=${XApiKey}`
      },
      body: JSON.stringify([
        {
          id: flowIdentifier,
          path: smbPath,
          name: filename
        }
      ])
    }
  );

  if (!finishResponse.ok) {
    throw new Error(
      `finish-upload failed: ${finishResponse.status}`
    );
  }

  return await finishResponse.json() || null;
}

async function moveFile(XApiKey, src, dest) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey || !src || !dest) { console.error("Not all required arguments are provided."); return null; }

  let mv = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/lmn/smbclient/move"), {
      method: 'POST',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      },
      body: JSON.stringify({ "src": src, "dst": dest })
    });
    if (config.debug) { console.log((config.serverUrl + "/api/lmn/smbclient/move"), statusCode); }
    mv = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return mv;
}

async function rmFile(XApiKey, smbPath) {
  if (!config.config_set) { console.error("The configuration must be set first."); return null; }
  if (!XApiKey || !smbPath) { console.error("Not all required arguments are provided."); return null; }

  let rm = null;

  if (config.isServerVersionBelow74) {
    const { statusCode, body } = await request((config.serverUrl + "/api/lmn/smbclient/unlink"), {
      method: 'POST',
      dispatcher: agent,
      headers: {
        "Content-Type": 'application/json',
        "Cookie": `session=${XApiKey}`
      },
      body: JSON.stringify({ "path": smbPath })
    });
    if (config.debug) { console.log((config.serverUrl + "/api/lmn/smbclient/unlink"), statusCode); }
    rm = await body.json();
  } else {
    console.error(NOT_SUPPORTED);
  }

  return rm;
}

export default {
  configure,
  login,

  getIdentity,
  getQuota,

  getDisplayOptions,
  getUICustomFields,

  getSetupStatus,
  getSessionTime,

  getShares,
  list_dir,
  uploadFile,
  moveFile,
  rmFile,
};
