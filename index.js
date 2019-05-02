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
function LoginForm() { //U: form login
  var my= this; //A: I want my closueres back!
	my.render= function(props, state) {
		return (
			h('div',{},
				h('div',{},
					h('label',{},'Usuario'),
					h('input',{},''),
				),
				h('div',{},
					h('label',{},'Clave'),
					h('input',{type: 'password'},''),
				),
			));
	}
}
LoginForm.prototype= new Component();

//------------------------------------------------------------
SessionUsr= null;

function App() { //U:pantalla principal
  var my= this; //A: I want my closueres back!
	function logout() {
		SessionUsr= null;
		my.setState({});
	}

	function login() {
		SessionUsr= 'pepe';
		my.setState({});
	}

	my.render= function(props, state) {
		return (h('div',{},
			h('div',{},
				SessionUsr ? 
					h(Btn,{onClick: logout},'Logout '+SessionUsr) : 
					h(Btn,{onClick: login},'Login')
			),

			SessionUsr ? 
				h(PassMgrScr) :
				h(LoginForm) ,
		));
	}
}
App.prototype= new Component();

render(h(App), document.body);


