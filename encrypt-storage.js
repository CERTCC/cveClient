/* Encryption API using JavaScript native crypto.js and indexeDB for storing private keys */
const encrypt_storage_version = "1.1.15";
async function encryptMessage(message,publicKey) {
    const encoded = new TextEncoder().encode(message);
    /* RSA-OAEP-4096 with SHA-256 has a maximum plaintext size of 446 bytes. */
    if (encoded.byteLength > 446) {
        throw new RangeError("RSA-OAEP message exceeds the 446-byte limit");
    }
    return window.crypto.subtle.encrypt({name: "RSA-OAEP"}, publicKey, encoded);
}
async function decryptMessage(ciphertext,privateKey) {
    let decrypted = await window.crypto.subtle.decrypt(
	{
	    name: "RSA-OAEP"
	},
	privateKey,
	ciphertext
    );

    let dec = new TextDecoder();
    return dec.decode(decrypted);
}
async function arrayBuffertoURI(arrayBuffer) {
    const blob = new Blob([arrayBuffer]);
    return new Promise((resolve, reject) => {
	const reader = new FileReader()
	reader.onloadend = function() {
	    resolve(reader.result);
	};
	reader.onerror = function() { reject(reader.error); };
	reader.readAsDataURL(blob);
    });
}
function URItoarrayBuffer(URI) {
    const parts = URI.split(',');
    if (parts.length < 2) throw new TypeError("Invalid data URI");
    const byteString = atob(parts[1]);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
    return bytes.buffer;
}


async function sha256sum(msg) {
    const enc = new TextEncoder().encode(msg);
    const buff = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buff), function(b) {
	return b.toString(16).padStart(2, '0');
    }).join('');
}

function getIndexedDB() {
    return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB
        || window.msIndexedDB || window.shimIndexedDB;
}

function dbManager(user,key,sum) {
    return new Promise(function(resolve, reject) {
	const indexedDB = getIndexedDB();
        if (!indexedDB) {
            reject(new Error("IndexedDB is unavailable"));
            return;
        }
        const open = indexedDB.open("cve-services.apikeyStore", 1);
        open.onerror = function() {
            reject(open.error || new Error("Unable to open the key database"));
        };
        open.onblocked = function() {
            reject(new Error("The key database upgrade is blocked by another tab"));
        };	
	open.onupgradeneeded = function() {
	    const db = open.result;
	    if (!db.objectStoreNames.contains("keyStore"))  {
		const store = db.createObjectStore("keyStore", {keyPath: "user"});
		store.createIndex("sigIndex", ["sum.sha256"]);
	    }
	};
	open.onsuccess = function() {
            const db = open.result;
            let settled = false;
            const finish = function(fn, value) {
                if (settled) return;
                settled = true;
                db.close();
                fn(value);
            };

            let tx;
            try {
                tx = db.transaction("keyStore", key ? "readwrite" : "readonly");
                const store = tx.objectStore("keyStore");

                if (key) {
                    const request = store.put({user: user, key: key, sum: sum});
                    request.onerror = function() {
                        finish(reject, request.error || new Error("Unable to store the key"));
                    };
                    tx.oncomplete = function(event) { finish(resolve, event); };
		} else {
                    let request;
                    if (user) {
                        request = store.get(user);
                    } else if (sum && sum.sha256) {
                        request = store.index("sigIndex").get([sum.sha256]);
                    } else {
                        finish(reject, new TypeError("A user or a checksum is required"));
                        return;
                    }
                    request.onsuccess = function(event) { finish(resolve, event); };
                    request.onerror = function() {
                        finish(reject, request.error || new Error("Unable to read the key"));
                    };
		}

                tx.onerror = function() {
                    finish(reject, tx.error || new Error("Key database transaction failed"));
                };
                tx.onabort = function() {
                    finish(reject, tx.error || new Error("Key database transaction aborted"));
                };
            } catch (error) {
                finish(reject, error);
            }
        };
    });
}
async function save_key(user,key) {
    /* With RSA generateKey(false), Web Crypto keeps the private key
       non-extractable while permitting export of the public key. */
    const fpb = await window.crypto.subtle.exportKey("jwk", key.publicKey);
    const storedKey = {epr: key.privateKey, epb: key.publicKey};
    const sum = {sha256: await sha256sum(fpb.n)};
    await dbManager(user, storedKey, sum);
    return storedKey;
}
function isCryptoKey(value) {
    return Object.prototype.toString.call(value) === "[object CryptoKey]";
}
async function import_key({epr,epb}) {
    /* Support both persistent CryptoKeys and legacy JWK records. */
    const prkey = isCryptoKey(epr) ? epr :
          await window.crypto.subtle.importKey("jwk", epr,
					       {name:"RSA-OAEP", hash:"SHA-256"}, false, ["decrypt"]);
    const pbkey = isCryptoKey(epb) ? epb :
          await window.crypto.subtle.importKey("jwk", epb,
					       {name:"RSA-OAEP", hash:"SHA-256"}, false, ["encrypt"]);
    return {privateKey: prkey, publicKey: pbkey};
}

async function check_create_key(user) {
    let dbKey = await dbManager(user);
    if(('target' in dbKey) && (dbKey.target.result) &&
       (dbKey.target.result.user == user)) {
	return import_key(dbKey.target.result.key);
    }
    return window.crypto.subtle.generateKey(
	{
	    name: "RSA-OAEP",
	    modulusLength: 4096,
	    publicExponent: new Uint8Array([1, 0, 1]),
	    hash: "SHA-256",
	},
	true,
	["encrypt", "decrypt"]
    ).then(function(key) {
	save_key(user,key);
	return key;
    });
}

/* Node.js / test environment exports */
if (typeof module !== "undefined" && module.exports) {
    module.exports = { encryptMessage, decryptMessage, arrayBuffertoURI,
		       URItoarrayBuffer, sha256sum, dbManager, save_key, import_key,
		       check_create_key };
}
