console.log("index js");

//============================================================
const Base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const PrintableChars= 'a-z0-9!"#$%&\'()*+,./:;<=>?@[] ^_`{|}~-';
const ReNonPrintable= /[^a-z0-9!"#$%&'()*+,.\/:;<=>?@\[\] ^_`{|}~-]/g;

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
BotonPillClass= "f6 link dim br-pill ph3 pv2 mb2 dib white bg-dark-gray";

function onMsg(msg) {} //U: mostrar mensaje en ui, se redefine mas abajo

function Btn({children, ...props}) {
	return h('a',{ "class": BotonArribaClass, ...props }, children);
}

//------------------------------------------------------------
UsrPassDflt= `#Formato: en cada linea user:#:hash o user:!:pass
ana:!:lista
hugo:!:suario
`;

function PassMgrScr() { //U:pantalla para administrar usuario y clave
  var my= this; //A: I want my closueres back!
	console.log("MNT");
  Component.apply(my,arguments);  //A: initialize with parent
  my.componentWillMount= function () { //A: parent my call our member functions
		passLoad();
  };

	function passLoad() {
		if (my.state.pwd || Session.UsrPassSha=="loading") return;
		Session.UsrPassSha= "loading"; 
		my.state.pwd= UsrPassDflt;
		onMsg("Loading ...");
		get_file_github(Session.RepoElegido+'/cfg/users.dat',Session)
			.then(res => {
					Session.UsrPassSha= res.sha;	
					my.setState({pwd: atob(res.content)});
					onMsg("Loaded");
		});
	}

	function passUpdate() {
		var s2= my.state.pwd.split(/\r?\n/)
			.map(l => { 
				var m= l.match(/^\s*([^:#]+):([!#]):(\S+)/);
				return m ? 
					m[2]!='#' ? m[1]+':#:'+HashPass(m[1],m[3]) : m[1]+':'+m[2]+':'+m[3] :
					l;
				})
			.join("\n");
		console.log("PWD",s2);
		my.setState({pwd: s2});
	}

	function passSave() {
		passUpdate();
		set_file_github({fname: Session.RepoElegido+'/cfg/users.dat', sha: Session.UsrPassSha}, my.state.pwd, Session)
			.then(res => {
				console.log("passSave",res);
				if (typeof(res)=="object") {
					if (res.commit) { 
						Session.UsrPassSha= res.commit.sha; //A: guardo para proximo save
						onMsg("Data saved");
						return ;
					}				
					else {
						onMsg("Error saving data "+res.message);
						return;
					}
				}
				//A: catch all
				onMsg("Error saving data");
			});
	}

  my.render= function(props, state) {
    return (h('div',{},
				h('div',{},'Users and passwords (or hashes)'),
				h('textarea',{ style: 'width: 100%; height: 10em;', onInput: linkState(this,'pwd'), value: state.pwd },''),
        h(Btn,{onClick: passUpdate},'Preview'),
        h(Btn,{onClick: passSave},'Save'),
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
function SelectOne() { //U: elegir 
  var my= this; 
	my.render= function(props, state) {
		return (
			h('div',{},
				h('h1',{},props.title),
				h('ul',{},
					Object.keys(props.data).map( k => 
						h('li',{ }, 
							h('a', {onClick: (e) => {e.preventDefault(); props.onData( k )}, "class": BotonPillClass, href: ''}, props.data[k])) 
					)
				),
			));
	}
}
SelectOne.prototype= new Component();

function RepoForm() {
	var my= this;

	var props;
	var data;
	var repoName;
	var repoDsc;

	function crearRepo() {
		repoName= repoName.toLowerCase().replace(/[^a-z0-9_]/g,'_');
		repoDsc= repoDsc.replace(ReNonPrintable,' ').replace(/\s+/,' ');
		if (confirm('Create defs repo?\n'+repoName)) {
			onMsg("Creating repo");
			create_repo_github({fname: repoName, dsc: repoDsc},Session)
			.then(res => {
				if (res.full_name) { //A: success
					Session.repos.push(res);
					Session.repos= Session.repos.sort( (a,b) => (a>b ? -1 : 1) );
					onMsg('Repo '+repoName+' created');
					props.onData(repoName);	
				}	
				else {
					if (res.errors) {
						onMsg('ERROR '+res.errors[0].message);
					}
					else {
						onMsg('ERROR '+(res.message ||''));	
					}
				}
			});

		}
	}

	function onData(repo) {
		console.log("RepoForm onData",repo);
		if (repo!='+ NEW +') {
			props.onData(repo);
		}
		else {
			my.setState({quiereNuevo: true});	
		}
	}

	my.render= function (aProps) {
		props= aProps;
		if (!data) {
		data= {}; Session.repos.map( r => {
			if (! r.name.match(/_res$/)) { //A: no es de resultados
				data[r.full_name]= r.owner.login==Session.user ? r.name : r.full_name;
			}
		});
		data["+ NEW +"]= "+ NEW +"; 
		}

		return !my.state.quiereNuevo ? 
			h(SelectOne,{ 
					title: 'Select a repository for protocol definitions',
					data: data,
					...props,
	 				onData: onData
			}) :
			h('div', {}, 
				h('h1',{},'Crear repositorio de definiciones para SmartWorkAr'),
				h('div',{},
					h('label',{},'Name'),
					h('input',{onInput: (e) => {repoName= e.target.value}} ),
				),
				h('div',{},
					h('label',{},'Description'),
					h('input',{onInput: (e) => {repoDsc= e.target.value}}),
				),
				h('div',{},
					h(Btn,{onClick: () => my.setState({quiereNuevo: false})},'Cancel'),
					h(Btn,{onClick: crearRepo},'Create'),
				 )
			 )
		;

	}
}
RepoForm.prototype= new Component();

//------------------------------------------------------------
Acciones= {
	"usradmin": "Manage users and credentials",
  "editdef": "Edit a process definition", 
  "results": "View results",
}


function App() { //U:pantalla principal
  var my= this; //A: I want my closueres back!


	my.componentDidMount= function () {
		onMsg= function (msg) {
			console.log("MSG",msg);
			document.querySelector('#msg').innerHTML= msg;	
		}
	}

	function logout() {
		Session= {}; //A: limpiamos la sesion
		my.setState({});
	}

	function login() {
		onMsg('Login in ...');
		keys_file_github('',{user: Login.user, pass: Login.pass})
			.then( res => {
				if (Array.isArray(res)) {
					Session.user= Login.user;
					Session.pass= Login.pass;
					Session.repos= res;	
					onMsg('');
				}
				else {
					onMsg((res && typeof(res)=='object' && res.message) || 'Error' );
				}
				my.setState({});
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

	function onAccionElegida(accion) {
		Session.AccionElegida= accion;
		my.setState({});	
	}

	function elegirAccion() {
		Session.AccionElegida= null;
		my.setState({});
	}

	my.render= function(props, state) {
		isRendering= true;

		var r= (h('div',{},
			h('div',{style: 'width: 100%; height: 36px;'},
				h('div',{style: 'display: inline-block; height: inherit;', id: 'msg'}, ''),

				h('div',{style: 'display: inline-block; height: inherit; right: 0px; position: absolute; text-align: right;'}, 

					Session.AccionElegida ? 
						h(Btn,{onClick: elegirAccion},'Menu') : 
            '',

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
			Session.AccionElegida==null ?
				h(SelectOne, {onData: onAccionElegida, data: Acciones}) :
			Session.AccionElegida=='usradmin' ? 
				h(PassMgrScr) :
			Session.AccionElegida=='results' ? 
				h('a',{target: "procresults", href: 'https://github.com/'+Session.RepoElegido+'_res', 'class': BotonPillClass},'Ver')	:
				h('div',{},'Under construction')
				, 
		)); 
		return r;
	}
}
App.prototype= new Component();

render(h(App), document.body);

document.title= "SmartWorkAr Admin";
