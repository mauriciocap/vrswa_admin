console.log("index js");

//============================================================
const Base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function randomString(len) {
	return (new Array(len)).fill(" ")
		.map( x => Base64Chars[ Math.floor(Math.random()* Base64Chars.length) ] )
		.join('');
}

function BytesToBase64(bytes) {
	return btoa(String.fromCharCode.apply(null,bytes));
}

function HashSha256(s) {
	var hash = sha256.create();
	hash.update(s);
	return hash.array(); 
}


function HashPass(user, pass, salt) { //U: mantener IGUAL que Core/Util/Crypto/HashPass
	salt= salt || randomString(8);
	return salt+BytesToBase64( HashSha256( salt+"\t"+user+"\t"+pass ) );	
}

//============================================================
Session= {}; //U: la sesion en github

//============================================================
const { Component, h, render } = window.preact;

BotonArribaClass= "f6 link dim mr1 pa3 pv2 mb2 dib white bg-dark-gray boton-arriba";

function Btn({children, ...props}) {
	return h('a',{ "class": BotonArribaClass, ...props }, children);
}

//------------------------------------------------------------
function PassMgrScr() { //U:pantalla para administrar usuario y clave
  var my= this; //A: I want my closueres back!
	my.state= {
		pwd: 
`#Formato: en cada linea user:#:hash o user:!:pass
ana:!:lista
hugo:!:suario
`,
	};
 
  Component.apply(my,arguments);  //A: initialize with parent
  my.componentDidMount= function () { //A: parent my call our member functions
  };

	function passUpdate() {
		var s2= my.state.pwd.split(/\r?\n/)
			.map(l => { 
				var m= l.match(/^\s*([^:#]+):([!#]):(\S+)/);
				return m ? 
					m[2]=='!' ? m[1]+':#:'+HashPass(m[1],m[3]) : m[1]+':'+m[2]+':'+m[3] :
					l;
				})
			.join("\n");
		console.log("PWD",s2);
		my.setState({pwd: s2});
	}

  my.render= function(props, state) {
    return (h('div',{},
				h('div',{},'Usuarios y claves'),
				h('textarea',{ style: 'width: 100%; height: 10em;', onInput: linkState(this,'pwd'), value: state.pwd },''),
        h(Btn,{onClick: passUpdate},'Actualizar'),
      ));
  }
}
PassMgrScr.prototype= new Component();

//------------------------------------------------------------
Login= {};
function LoginForm() { //U: form login
  var my= this; 

	function onKey(e, k, onData) {
		Login[k]= e.target.value;
		if (e.key== 'Enter') {
			onData();
		}	
	}

	my.render= function(props, state) {
		return (
			h('div',{},
				h('h1',{},'Login to your github account'),
				h('div',{},
					h('label',{},'User'),
					h('input',{onKeyUp: e => onKey(e,'user',props.onData)},''),
				),
				h('div',{},
					h('label',{},'Pass'),
					h('input',{onKeyUp: e => onKey(e,'pass',props.onData), type: 'password'},''),
				),
			));
	}
}
LoginForm.prototype= new Component();

//------------------------------------------------------------
function RepoForm() { //U: form login
  var my= this; 
	my.render= function(props, state) {
		return (
			h('div',{},
				h('h1',{},'Select a repository for protocol definitions'),
				h('ul',{},
					Session.repos.map( r => 
						h('li',{ onClick: () => props.onData( r.full_name ) }, 
							r.owner.login==Session.user ? r.name : r.full_name) 
					)
				),
			));
	}
}
RepoForm.prototype= new Component();

//------------------------------------------------------------

function App() { //U:pantalla principal
  var my= this; //A: I want my closueres back!

	function logout() {
		Session= {}; //A: limpiamos la sesion
		my.setState({});
	}

	function login() {
		keys_file_github('',{user: Login.user, pass: Login.pass})
			.then( res => {
				if (Array.isArray(res)) {
					Session.user= Login.user;
					Session.pass= Login.pass;
					Session.repos= res;	
					my.setState({});
				}
				else {
					my.setState({ msg: (res && typeof(res)=='object' && res.message) || 'Error' });
				}
			});
	}

	function onRepoElegido(repo) {
		Session.RepoElegido= repo;
		my.setState({});
	}

	function elegirRepo() {
		Session.RepoElegido= null;
		my.setState({});
	}

	my.render= function(props, state) {
		return (h('div',{},
			h('div',{style: 'width: 100%; height: 36px;'},
				h('div',{style: 'display: inline-block; height: inherit;'}, my.state.msg || ''),
				h('div',{style: 'display: inline-block; height: inherit; right: 0px; position: absolute; text-align: right;'}, 
					Session.RepoElegido ? 
						h(Btn,{onClick: elegirRepo},'Repo '+Session.RepoElegido) : 
            '',

					Session.user ? 
						h(Btn,{onClick: logout},'Logout '+Session.user) : 
						h(Btn,{onClick: login},'Login')
				),
			),

			Session.user==null ? 
				h(LoginForm, {onData: login} ) :
			Session.RepoElegido==null ?
				h(RepoForm, {onData: onRepoElegido}) :
			h(PassMgrScr), 
		));
	}
}
App.prototype= new Component();

render(h(App), document.body);


