//INFO:funciones para guardar y leer de github con usuario y clave

function mifetch(url = ``, data, options={}) { //U: post usando "fetch", mas comodo
    var fetchOpts= {
      method: options.method || "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
          "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client

  };

  if (options.user) {
   fetchOpts.headers['Authorization']= 'Basic ' + btoa(options.user + ":" + options.pass);
  }

  if (data) { 
    fetchOpts.body= JSON.stringify(data); // body data type must match "Content-Type" header
  }

  return fetch(url, fetchOpts)
    .then(response => response.json()); // parses JSON response into native Javascript objects 
}

//VER: api https://developer.github.com/v3/
//VER: api github https://gist.github.com/caspyin/2288960
function set_file_github(fdsc,txt,opts) {
  if (typeof(fdsc)=="string") { fdsc= {fname: fdsc } }
  //A: fdsc es un objeto que tiene fname
  var m= fdsc.fname.match(/^([^\/]+\/[^\/]+)\/?(.*)/);
  var repo= m[1]; //A: el repo es user/repo, asi podemos acceder a los que nos compartieron otros usuarios
  var path= m[2];
  if (repo=="gist") {
    var files= {};
    files[path]= {"content":txt};
    return mifetch('https://api.github.com/gists',{
      "description":"Guardar en Github",
      "public":"true",
      "files":files
    },Object.assign({method: "POST"},opts));
  }
  else {
    //VER: https://developer.github.com/v3/repos/contents/#update-a-file
    return mifetch('https://api.github.com/repos/'+repo+'/contents/'+path, {
      "message": "Guardar en Github",
      "content": btoa(txt),
      "sha": fdsc.sha,
    }, Object.assign({method: 'PUT'},opts));
  }
}

function get_file_github(fdsc,opts) {
  if (typeof(fdsc)=="string") { fdsc= {fname: fdsc } }
  //A: fdsc es un objeto que tiene fname
  var m= fdsc.fname.match(/^([^\/]+\/[^\/]+)\/?(.*)/);
  var repo= m[1]; //A: el repo es user/repo, asi podemos acceder a los que nos compartieron otros usuarios
  var path= m[2];
  if (repo=="gist") {
    console.log("NO IMPLEMENTADO"); //XXX:los gists tienen como nombre un hash y hay que leer la lista, buscar la descripcion, etc.
    //la lista se consigue con mifetch("https://api.github.com/users/mauriciocap/gists",null,opts)
  }
  else {
    //VER: https://developer.github.com/v3/repos/contents/#update-a-file
    return mifetch('https://api.github.com/repos/'+repo+'/contents/'+path, null, opts);
  }
}

function keys_file_github(fname,opts) {
  if (fname=='') { //A: los repos
    return mifetch("https://api.github.com/user/repos",null,opts);
  }
  else { //A: un path en un repo
    return get_file_github(fname, opts);
  }
}

function create_repo_github(fdsc,opts) {
  if (typeof(fdsc)=="string") { fdsc= {fname: fdsc } }
	return mifetch('https://api.github.com/user/repos',
		{
			"name": fdsc.fname,
			"description": fdsc.dsc||'',
			"homepage": fdsc.homepage||null,
			"private": fdsc.private||false,
			"auto_init": true,
		},
		Object.assign({method: "POST"},opts));
}

