console.log("index js");

function BytesToBase64(bytes) {
	return btoa(String.fromCharCode.apply(null,bytes));
}

function HashSha256(s) {
	var hash = sha256.create();
	hash.update(s);
	return hash.array(); 
}


function HashPass(user, pass, salt) { //U: mantener IGUAL que Core/Util/Crypto/HashPass
	salt= salt || "12345678";
	return salt+BytesToBase64( HashSha256( salt+"\t"+user+"\t"+pass ) );	
}
