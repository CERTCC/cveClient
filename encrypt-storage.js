/* Encryption API using JavaScript native crypto.js and indexeDB for storing private keys */
const encrypt_storage_version = "1.1.14";
async function encryptMessage(message,publicKey) {
    let encoded = new TextEncoder().encode(message);
    let ciphertext = await window.crypto.subtle.encrypt(
	{
	    name: "RSA-OAEP"
	},
	publicKey,
	encoded
    );
    return ciphertext;
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
    let blob = new Blob([arrayBuffer]);
    return new Promise((resolve) => {
	let reader = new FileReader()
	reader.onloadend = function() {
	    resolve(reader.result);
	};
	reader.readAsDataURL(blob);
    });
}
function URItoarrayBuffer(URI) {
    var byteString = atob(URI.split(',')[1]);
    var arrayBuffer = new ArrayBuffer(byteString.length);
    var _ia = new Uint8Array(arrayBuffer);
    for (var i = 0; i < byteString.length; i++) {
	_ia[i] = byteString.charCodeAt(i);
    }
    return arrayBuffer;
}


async function sha256sum(msg) {
    let enc = new TextEncoder().encode(msg);
    const buff = await crypto.subtle.digest('SHA-256', enc);
    const barray = Array.from(new Uint8Array(buff));
    let hex = barray.map(function(b) {
	return b.toString(16).padStart(2, '0');
    }).join('');
    return hex;
};
function dbManager(user,key,sum) {
    return new Promise(function(resolve, reject) { 
	var indexedDB = window.indexedDB || window.mozIndexedDB
	    || window.webkitIndexedDB || window.msIndexedDB
	    || window.shimIndexedDB;
	var open = indexedDB.open("cve-services.apikeyStore", 1);
	open.onupgradeneeded = function() {
	    var db = open.result;
	    if (!db.objectStoreNames.contains("keyStore"))  {
		var store = db.createObjectStore("keyStore",
						 {keyPath: "user"});
		var index = store.createIndex("sigIndex", ["sum.sha256"]);
	    }
	};
	open.onsuccess = function() {
	    var db = open.result;
	    var tx = db.transaction("keyStore", "readwrite");
	    var store = tx.objectStore("keyStore");
	    if(key) {
		store.put({user: user, key: key, sum: sum});
	    } else {
		if(user) {
		    var getUser = store.get(user);
		    getUser.onsuccess = function(q) {
			resolve(q);
		    };
		} else if(sum.sha256) {
		    var index = store.index("sigIndex");
		    var getSum = index.get([sum.sha256]);
		    getSum.onsuccess = function(q) {
			resolve(q);
		    };
		} else {
		    reject("A user or a checksum is required");
		}
	    };
	    tx.oncomplete = function() {
		db.close();
	    };
	}
    });
}
async function save_key(user,key) {
    let fpb = await window.crypto.subtle.exportKey("jwk", key.publicKey);
    let fpr = await window.crypto.subtle.exportKey("jwk", key.privateKey);
    let exportKey = {epr: fpr, epb: fpb};
    let sum = {sha256: await sha256sum(fpb.n)};
    dbManager(user,exportKey,sum);
    return exportKey;
}
async function import_key({epr,epb}) {
    let prkey = await window.crypto.subtle.importKey("jwk",epr,{name:"RSA-OAEP", hash: {name: "SHA-256"}},false,['decrypt']);
    let pbkey = await window.crypto.subtle.importKey("jwk",epb,{name:"RSA-OAEP", hash: {name: "SHA-256"}},false,['encrypt']);
    return { privateKey: prkey, publicKey: pbkey  };
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
