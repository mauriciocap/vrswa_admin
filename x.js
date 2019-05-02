CamundaModdle= JSON.parse($.ajax({type: 'GET', async: false, url: 'https://raw.githubusercontent.com/camunda/camunda-bpmn-moddle/master/resources/camunda.json'}).responseText);

Modeler = new BpmnJS({
	container: '#canvas',
	keyboard: {
		bindTo: window
	},
	moddleExtensions: {
		camunda: CamundaModdle //A: necesitamos para extensiones tipo properties, forms, etc.
	}
});
//A: tengo el modeler de bpmn-js que coordina dibujo y modelo

//============================================================
//S: propiedades
CmdStack= Modeler.get('commandStack');
//A: el modeler tiene un commandStack que ejecuta "command" (pattern) y sincroniza dibujo y modelo
BpmnFactory= Modeler.get('bpmnFactory');
//A: el modeler tiene una Factory que crea elementos de BPMN

onElementSelected= function (e) {};

//El properties panel hace por ej. "node_modules/bpmn-js-properties-panel/lib/cmd/UpdateBusinessObjectHandler.js"
eventBus= Modeler.get('eventBus');
eventBus.on('root.added', function(e) {
	console.log("root.added", XE= e);
	onElementSelected(e);
});

eventBus.on('selection.changed', function(e) {
	console.log("selection.changed", XE= e.newSelection[0]);
	onElementSelected(e.newSelection[0]);
});

eventBus.on('elements.changed', function(e) {
	console.log("elements.changed", XES= e.elements);
	onElementSelected(e.elements);
});

eventBus.on('diagram.destroy', function() {
	console.log("diagram.destroy");
});


function mmChgName(e,k,v) {
	Xoldp= {}; Xoldp[k]= e.businessObject[k];
	Xnewp= {}; Xnewp[k]= v;
	CmdStack.execute("element.updateProperties", {
		element: e, 
		oldProperties: Xoldp, //Le pasa los valores anteriores Y deben coincidir, tipo "optimistic locking"
		properties: Xnewp,
		changed: [e]
	});
}

function mmCondExpr(e, body_str) {
	var old= e.businessObject.conditionExpression;
	var nuevo= BpmnFactory.create('bpmn:FormalExpression',{body: body_str});
	nuevo.$parent= e;
	CmdStack.execute("element.updateProperties", {
		element: e, 
		oldProperties: {conditionExpression: old}, //Le pasa los valores anteriores Y deben coincidir, tipo "optimistic locking"
		properties: {conditionExpression: nuevo},
		changed: [e]
	});
}

function mmExtProps(e) {
	ext_e= e.businessObject.extensionElements;
	if (!ext_e) {
		ext_e= BpmnFactory.create('bpmn:ExtensionElements');
		ext_e.$parent= e;
		e.businessObject.extensionElements= ext_e;
	}

	props= ext_e.values && ext_e.values.find(x => x.$type=='camunda:Properties');
	if (!props) {
		props= BpmnFactory.create('camunda:Properties');
		props.$parent= ext_e;
		ext_e.values= ext_e.value || [];
		ext_e.values.push(props);
	}

	return props;
}

function mmExtProp(e,k,v) {
	props= mmExtProps(e);

	prop= props.values && props.values.find(x => x.$type=='camunda:Property'); 
	if (!prop) {
		prop= BpmnFactory.create('camunda:Property');
		prop.$parent= props;
		prop.name= k;
		prop.value= v;
		props.values= props.values || [];
		props.values.push(prop);
	}
}

function mmExtForm(e,k,v) {
	//A: asumiendo que ya tiene exension elements ...
	props= mmExtProps(e);
	form= props.values && props.values.find(x => x.$type=='camunda:FormData'); 
	if (!form) {
		form= BpmnFactory.create('camunda:FormData');
		form.$parent= props; //XXX:buscar de tipo camunda:Properties
	}


	field= BpmnFactory.create('camunda:FormField');
	field.$parent= form;
	field.type='string';
	field.label='YoMePregunto';

	form.fields= [field];
	e.businessObject.extensionElements.values.push(form);
}

/*
	 Cuando renombro el form ...

	 "properties-panel.update-businessobject" 

	 Cuando agrego fields ...
	 node_modules/bpmn-js-properties-panel/lib/provider/camunda/parts/FormProps.js:132

	 fc= bpmnModeler.get('bpmnFactory')
	 fc.create('bpmn:ExtensionElements')
	 fc.create('camunda:FormData')
	 fc.create('camunda:FormField')

	 Cuando agrego una condicion a una flechita ...
	 le pone como property en conditionExpression
	 una bpmn:FormalExpression con body la expresion como string
	 y parent la flechita

	 Cuando agrego properties (extension)
	"update-businessobject" asigna a extensionElements 
		un nodo bpmn:extensionElements
			que en sus values tiene un array [camunda:properties] 
			que en sus values tiene un array [camunda:property]
		todos tienen su parent!


*/

const { Component, h, render } = window.preact;

function App() {
  var my= this; //A: I want my closueres back!
 
  Component.apply(my,arguments);  //A: initialize with parent
  my.componentDidMount= function () { //A: parent my call our member functions
		onElementSelected= function (e) {
			if (! e || ! e.businessObject) { my.setState({elegido: null}); return }
			var props= mmExtProps(e);
			var prop= props.values && props.values.find(x => x.$type=='camunda:Property');

			try {
				my.setState({
					elegido: { 
						e, 
						id: e.businessObject.id,
						name: e.businessObject.name,
						cond: e.businessObject.conditionExpression,
						widget: prop && prop.value,
					}
				});
			}
			catch (ex) {
				//my.setState({ elegido: null });	
			};
		}
  };

	function onInputId(e) {
		console.log("XXX",XXE= e, my.state);
		mmChgName(my.state.elegido.e,'id',e.target.value);
	}

	function onInputName(e) {
		console.log("XXX",XXE= e, my.state);
		mmChgName(my.state.elegido.e,'name',e.target.value);
	}

	function onInputCond(e) {
		console.log("XXX",XXE= e, my.state);
		mmCondExpr(my.state.elegido.e,e.target.value);
	}

	function onInputWidget(e) {
		mmExtProp(my.state.elegido.e, 'Widget', e.target.value);
		my.state.elegido.widget= e.target.value;
		my.setState({elegido: my.state.elegido});
	}

  my.render= function(props, state) {
    return (
        h('div', {id:'app'}, state.elegido ? 
					h('div',{},
						h('div',{}, 
							h('label',{},'Id'),
							h('input',{value: state.elegido.id, onKeyUp: onInputId},''),
						 ),
						h('div',{}, 
							h('label',{},'Nombre'),
							h('input',{value: state.elegido.name, onKeyUp: onInputName},''),
						 ),

						(!state.elegido.e.businessObject.sourceRef || state.elegido.e.businessObject.sourceRef.$type!="bpmn:ExclusiveGateway") ? null :
						h('div',{}, 
							h('label',{},'Condicion'),
							h('input',{value: state.elegido.cond && state.elegido.cond.body, onKeyUp: onInputCond},''),
						 ),

						(! state.elegido.e.businessObject.$type.match(/Task/i) ) ? null :
						h('div',{}, 
							h('label',{},'Widget'),
							h('select',{value: state.elegido.widget || 'Ninguno', onChange: onInputWidget },
									"Ninguno FotoTomar FotoMostrar Form".split(/\s+/).map(k =>
										h('option',{},k)
										)
								),
						 ),
						(state.elegido.widget!='Form' ) ? null : 
						h('div',{},
								h('label',{},'Field: '),
								h('input',{placeholder: 'id', style: 'width: 5em;'},''),
								h('input',{placeholder: 'Etiqueta', style: 'width: 10em;'},''),
								h('select',{},
									'string long bool enum'.split(/\s+/).map( k =>
										h('option',{},k)
										)
								 ),
						 )
						)
					: 
					h('div',{},'Elegi un elemento con el mouse'),	
        )
      );
  }
}
App.prototype= new Component();

Props_el= $('<div/>').appendTo(document.body);
render(h(App), Props_el[0]);

//============================================================
//S: leer y guardar
function openDiagram(bpmnXML) { //: abrir un diagrama con ese XML
	Modeler.importXML(bpmnXML, function(err) {
		if (err) { return console.error('could not import BPMN 2.0 diagram', err); }
		var canvas = Modeler.get('canvas');
		canvas.zoom('fit-viewport'); //A: zoom to fit full viewport
	});
}

function loadDiagram(diagramUrl) { //U: load external diagram file via AJAX and open it
	if (!diagramUrl) { diagramUrl= prompt("Url?", window.location.href.replace(/[^\/]*$/,'')) }
	$.get(diagramUrl, openDiagram, 'text');
}

function exportDiagram() { //U: guardar, conectar a backend
	Modeler.saveXML({ format: true }, function(err, xml) {
		if (err) { return console.error('could not save BPMN 2.0 diagram', err); }
		alert('Diagram exported. Check the developer tools!');
		console.log('DIAGRAM', xml);
	});
}

//UI: conectar los botones
BotonArribaClass= "f6 link dim mr1 pa3 pv2 mb2 dib white bg-dark-gray boton-arriba";
dl_bpmn_el= document.createElement('a');
dl_bpmn_el.setAttribute('download','procdef.bpmn');
dl_bpmn_el.innerHTML= 'BPMN <i class="material-icons">save_alt</i>';
dl_bpmn_el.className= BotonArribaClass;
dl_bpmn_el.href='';
$('#botones').append(dl_bpmn_el);

function cuandoPideDownloadBPMN(e) {
	Modeler.saveXML({ format: true }, function(err, xml) {
	  var enc= encodeURIComponent(xml);
		e.target.href= 'data:application/octet-stream,'+enc;
	});
}
dl_bpmn_el.onclick= cuandoPideDownloadBPMN;

dl_json_el= document.createElement('a');
dl_json_el.setAttribute('download','procdef.json');
dl_json_el.innerHTML= 'JSON <i class="material-icons">save_alt</i>';
dl_json_el.className= BotonArribaClass;
dl_json_el.href='';
$('#botones').append(dl_json_el);

//A: nececitamos un replacer especial para strigify porque sino nos faltan propiedades
BpmnJsonSerOpts= {};
'$parent $attrs di'.split(/\s+/).forEach(k => BpmnJsonSerOpts[k]='exclude');
'incoming outgoing'.split(/\s+/).forEach(k => BpmnJsonSerOpts[k]= (arr) => arr.map(e => e.id));
'targetRef sourceRef'.split(/\s+/).forEach(k => (BpmnJsonSerOpts[k]= (e) => e.id));

function bpmn_json_replacer(key, value) {
	console.log("R",key,typeof(value),value);
	if (Array.isArray(value)) { }
	else if (typeof value=="object") { var v0= value; value= {}; 
		Object.getOwnPropertyNames(v0).forEach(k => {
				var so= BpmnJsonSerOpts[k];
				if (so=='exclude') { }
				else if (typeof so=='function') {
					value[k]= so(v0[k]);
				}
				else {
					value[k]= v0[k];
				}
		}); 
	}
  return value;
}

function model_toJson() {
	return JSON.stringify(Modeler.getDefinitions().rootElements[0],bpmn_json_replacer,1)
}

function cuandoPideDownloadJSON(e) {
  var enc= encodeURIComponent( model_toJson() ); //A:json indentado
	e.target.href= 'data:application/octet-stream,'+enc;
}
dl_json_el.onclick= cuandoPideDownloadJSON;

var ff= $('<div style="display: inline-block;"/>');
$('<input type="file" id="file" name="file" accept=".bpmn,.xml" class="inputfile"/>').appendTo(ff).change(function (e) {
	console.log("FE",XFE=e);
	file= e.originalEvent.target.files[0];
	reader = new FileReader();
	reader.onload= function (revt) {
		openDiagram(revt.target.result);
	};
	reader.readAsText(file);
});
$('<label style="width: auto;" for="file">Leer</label>').addClass(BotonArribaClass).appendTo(ff);
ff.appendTo('#botones');

$('<a>').addClass(BotonArribaClass).appendTo('#botones').html('Nuevo').click(function () { Modeler.createDiagram(); });

var diagramUrl0 = window.location.href+'/ex/simple.bpmn';
loadDiagram(diagramUrl0);

