function schemaToForm(schemaUrl, elementId) {
    "use strict";
    if( !(this instanceof schemaToForm) ){
	return new schemaToForm(...arguments);
    }
    this._version = "1.0.9";
    let main = this;
    async function fetchObj(url) {
	try {
            const response = await fetch(url);
            return await response.json();
	} catch (error) {
            console.error('Error fetching schema:', error);
            return null;
	}
    }
    function populate(obj, base) {
	Object.keys(obj).forEach(function(field) {
	    let bfield = field;
	    if(base)
		bfield = base + "." + field;
	    let el = document.querySelector("[data-path='" + bfield + "']");
	    if(el) {
		if(el.querySelector("div") &&
		   (!el.querySelector("div").checkVisibility())) {
		    displayOnly(el.querySelector("legend"));
		}
	    }
	    if(typeof(obj[field]) == "object") {
		if(field.match(/^\d+$/)) {
		    let count = parseInt(field) + 1;
		    let sfield = bfield.replace(/\.\d+$/,'.0');
		    let rcount = document.querySelectorAll("[data-path='" + sfield + "']").length;
		    
		    /* If the fields do not exist create them*/
		    if(rcount > 0 && rcount < count) {
			const tel = document.querySelector("[data-path='" + sfield + "']").querySelector("legend > a");
			if(tel && tel.parentElement)
			    cloner(tel.parentElement);
		    }
		} 
		return populate(obj[field], bfield);
	    }
	    if(el) {
		el.value = obj[field];
		if(el.style && el.style.border && el.style.border.indexOf("red") > -1) {
		    el.style.border = "1px solid green";
		    if(el.validity && el.validity.valid) { 
			const sp = document.createElement('span');
			sp.innerHTML = " &check; ";
			sp.style.color = "green";
			sp.setAttribute("data-valid",el.getAttribute("data-path"));
			el.after(sp);
		    }
		}
	    } else {
		console.error(obj, base, field);
	    }
	});
    }
    function resolveRef(ref, prop, schema) {
	const path = ref.replace(/^#\/definitions\//, '').split('/');
	let resolved = schema.definitions;
	path.forEach(p => {
	    if(p in resolved) 
		resolved = resolved[p];
	    else
		resolved = {};
	});
	let copyFields = ["examples","minItems","maxItems","allOf","anyOf"];
	copyFields.forEach(field => { if(prop && field in prop)
	    resolved[prop] = field[prop] });
	if(resolved.$ref)
	    return resolveRef(resolved.$ref, prop, schema);
	return resolved;
    }
    function elToField(el) {
	let elx;
	let eltype = "string";
	let elkey;
	let oldtype = "string";
	let tree = [];
	elx = el.parentElement;
	let cid = 0;
	while(elx) {
	    if(elx.tagName == "FIELDSET" && elx.hasAttribute("data-cid")) {
		cid = parseInt(elx.getAttribute("data-cid"));
	    }
	    if(elx.tagName == "DIV" && elx.hasAttribute("data-type")) {
		eltype = elx.getAttribute("data-type");
		elkey = elx.getAttribute("data-key");
		if(eltype == "array") {
		    if(oldtype == "object")
			tree.pop();
		    tree.push(cid);
		    tree.push(elkey);
		}
		if((eltype == "object") || ((eltype == "string" || eltype == "number" || eltype == "boolean" ) && elkey != '[]'))
		    tree.push(elkey);
		
		oldtype = eltype;
	    }
	    elx = elx.parentElement;
	}
	/* Remove the last element if the path value is empty like a.b.c.d.0 is a string/enum/int
	   and NOT an object or another array */
	if(tree[0] == "" && el.tagName != "FIELDSET")
	    tree.shift();
	el.setAttribute("data-path", tree.reverse().join("."));
    }
    main.elToField = elToField;
    function removeRequired(el) {
	el.removeAttribute("required");
	el.removeAttribute("data-required");	
	el.removeAttribute("style");
    }
    function makeRequired(el) {
	const allowed = ["INPUT","TEXTAREA","SELECT"];
	if(allowed.includes(el.tagName))
	    el.setAttribute("required", true);
	el.setAttribute("data-required",true);
	el.style.border = "1px solid red";
    }
    function hideDecloners(el) {
	let els = el.querySelectorAll(":scope > fieldset > legend > a[data-decloner]");
	if(els.length == 1) {
	    els[0].style.display = "";
	} else {
	    for(let i=0; i < els.length - 1; i++)
		els[i].style.display = "none";
	    els[els.length - 1].style.display = "";
	}
    }

    function decloner(el) {
	let es = el.parentElement.parentElement.querySelector(el.tagName).parentElement;
	if(el.querySelector("[data-hidder]") && (es.getAttribute("data-counter") == "0")) {
	    el.parentElement.querySelector("div").style.display = "none";
	    el.innerHTML = el.innerHTML.replace('[0]','[]');
	    if(el.querySelector("[data-hidder]"))
		el.querySelector("[data-hidder]").remove();
	    return;
	}
	if(es && es.hasAttribute("data-counter")) {
	    let delid = es.getAttribute("data-counter");
	    let er = el.parentElement.parentElement.querySelector("[data-cid='" + delid + "']");
	    if(er) {
		let et = er.parentElement;
		er.remove();
		hideDecloners(et);
		es.setAttribute("data-counter", String(parseInt(delid) - 1));
	    }
	}
    }
    function deleterButton(deleter) {
	if(!deleter) {
	    /* Identify a new deleter button with a data-hidder attribute*/
	    deleter = document.createElement('a');
	    deleter.setAttribute('data-hidder', "1");
	}
	deleter.innerHTML = " &#8854; ";
	deleter.style.color = "#dc3545";
	deleter.style.cursor = "pointer";
	deleter.setAttribute("title","Delete/Remove this entry");
	deleter.addEventListener("click", function () {
	    decloner(this.parentElement);
	});
	deleter.setAttribute('data-decloner', "1");	      
	return deleter;
    }
    function displayOnly(el) {
	el.parentElement.querySelectorAll("div").forEach(function(eldiv) {
	    eldiv.style.display = "block";
	})
	el.innerHTML = el.innerHTML.replaceAll('[]','[0]');
	if(!el.querySelector("[data-hidder]")){ 
	    el.appendChild(deleterButton());
	}
    }
    function cloner(el) {
	/* If the first div is invisible, this is a 
	   NOT required fieldset just display it and return */
	if((!el.hasAttribute("data-required")) && el.parentElement.querySelector("div").style.display == "none") {
	    return displayOnly(el);
	}
	let cloned = el.parentElement.cloneNode(true);
	if(cloned.querySelector("[data-hidder]"))
	    cloned.querySelector("[data-hidder]").remove();
	let i = parseInt(el.parentElement.getAttribute("data-counter") || "0");
	let elx = cloned.querySelector(el.tagName);
	if(elx) {
	    elx.innerHTML = elx.innerHTML.replace(/\[(\d+)\]/, function() {
		return "[" + String(i + 1) + "]";
	    });
	    elx.parentElement.setAttribute("data-cid", String(i + 1));
	    elx.parentElement.removeAttribute("data-counter");
	    let ela = elx.querySelector('a');
	    if(ela) {
		ela = deleterButton(ela);
	    }
	    
	}
	el.parentElement.setAttribute("data-counter", String(i + 1));
	el.parentElement.parentElement.appendChild(cloned);
	cloned.querySelectorAll('input,select:not([data-exclude])').forEach(elToField);
	hideDecloners(el.parentElement.parentElement);
    }

    function regexUpgrade(regex) {
	/*Upgrade regex that is invalid for v-mode to a compatible mode */
	try {
	    const _ = new RegExp(regex,"v");
	    return regex;
	} catch(err) {
	    let nregex = regex;
	    /* dash only in character classes otherwise but it in brackets escaped */
	    const vInvalid = /([^a-zA-Z0-9\\])\-([^a-zA-Z0-9])/g;
		
	    Array.from(new Set(regex.match(vInvalid))).forEach(function(bok) {
		    nregex = nregex.replaceAll(bok,bok.replaceAll('-','[\\-]')); 
	    });
	    try {
		new RegExp(nregex,"v");
		console.log("Replacing " + regex + " due to Error " + err +
			    "Now upgraded to " + nregex);
		return nregex;
	    } catch (err) {
		console.error("Cannot upgrade this " + regex + " due to Error " + err +
			    "Now upgraded to " + nregex);
		return "";
	    }
	}
    }


    
    function createInputFromProperty(key, property, required, schema) {
	const wrapper = document.createElement('div');
	if (property.$ref) {
	    property = resolveRef(property.$ref, property, schema);
	}
	wrapper.setAttribute("data-key", key);
	wrapper.setAttribute("data-type", property.type);
	const label = document.createElement('label');
	label.setAttribute('for', key);
	label.textContent = property.title || key;
	wrapper.appendChild(label);
	wrapper.appendChild (document.createTextNode (" "));
	/* If anyof or allof is setup some form of this field(set) is required*/
	if(property.items)
	    ["anyOf", "allOf", "oneOf"].forEach(yOf => {
		if(yOf in property.items) {
		    required = true;
		    if(!(yOf in property))
			property["validator"] = {}
		    property["validator"][yOf] = property.items[yOf];
		}
	    });
	let input;
	if (property.type === 'string') {
            input = document.createElement('input');
            input.setAttribute('type', property.format === 'email' ? 'email' : 'text');
	} else if (property.type === 'integer' || property.type === 'number') {
            input = document.createElement('input');
            input.setAttribute('type', 'number');
	} else if (property.type === 'boolean') {
            input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
	} else if ((property.type === 'array') && (property.items)) { 
	    if (property.items.enum) {
		input = document.createElement('select');
		input.setAttribute('multiple', true);
		property.items.enum.forEach(value => input.appendChild(new Option(value,value)));	      
            } else {
		label.style.display = "none";		    
		const fieldset = document.createElement('fieldset');
		const legend = document.createElement('legend');
		if(required) 
		    legend.innerHTML = (property.title || key) + ' [0]' ;
		else
		    legend.innerHTML = (property.title || key) + ' []' ;
		const adder = document.createElement('a');
		adder.style.color = "#007bff";
		adder.style.cursor = "pointer";
		adder.setAttribute("title","Add new entry for " + (property.title || key));
		adder.addEventListener("click", function () {
		    cloner(this.parentElement);
		});		
		adder.setAttribute('data-cloner', "1");	      
		adder.innerHTML = ' &#8853; ';
		fieldset.setAttribute("data-property", key);	      
		fieldset.setAttribute("data-counter", "0");
		fieldset.setAttribute("data-cid", "0");	      
		legend.appendChild(adder);
		fieldset.appendChild(legend);
		if(property.items.oneOf) {
		    const selectEl = document.createElement('select');
		    selectEl.setAttribute("data-exclude","oneOf");
		    const classBase = label.textContent + "oneOf";
		    selectEl.setAttribute("data-classBase", classBase);
		    const created = {};
		    property.items.oneOf.forEach((item,i) => {
			const className = classBase + String(i);
			if(item.required) {
			    selectEl.appendChild(new Option("Valid Formats: " + String(i), className));
			    item.required.forEach(subKey => {
				if(subKey in property.items.properties) {
				    if (!(subKey in created)) {
					let subItem = property.items.properties[subKey];
					/* First set of inputs will be default required i == 0 */
					const subInput = createInputFromProperty(subKey, subItem, i < 1, schema);
					created[subKey] = subInput;
				    }
				}
				created[subKey].querySelectorAll('input')
				    .forEach(x =>  x.classList.add(classBase,className));
			    });
			    selectEl.addEventListener(
				'change',
				function() {
				    let classBase = this.getAttribute("data-classBase");
				    document.querySelectorAll("." + classBase).forEach(removeRequired);
				    let className = this.options[this.selectedIndex].value;
				    document.querySelectorAll("." + className).forEach(makeRequired);
				},
				false
			    );			    
			} else {
			    selectEl.appendChild(new Option("Schema Formats: " + String(i), className));
			    if(item.$ref)
				item = resolveRef(item.$ref, item, schema);
			    let subKey = key + String(i);
			    /* item if it got resolved form $ref may have "required" fields*/
			    const subRequired = item.required && item.required.includes(subKey);
			    created[subKey] = createInputFromProperty("", item, false, schema);
			    created[subKey].classList.add(classBase,className);
			    if(i > 0)
				created[subKey].style.display = "none";
			    selectEl.addEventListener(
				'change',
				function() {
				    let classBase = this.getAttribute("data-classBase");
				    document.querySelectorAll("." + classBase)
					.forEach( x => x.style.display = "none");
				    let className = this.options[this.selectedIndex].value;
				    document.querySelectorAll("." + className)
					.forEach(x => x.style.display = "block");
				},
				false
			    );
			    
			}
		    });
		    /* Now add all the inputs */
		    Object.entries(created).forEach(function([_,x]) { fieldset.appendChild(x) });
		    fieldset.prepend(selectEl);
		} else {
		    let subItem;
		    if(property.items.$ref) {
			const subProperty = resolveRef(property.items.$ref, property.items, schema);
			let subKey = property.items.$ref.split('/').pop();
			const subRequired = property.minItems && property.minItems > 0;
			subItem = createInputFromProperty(subKey, subProperty, subRequired, schema);
		    } else {
			subItem = createInputFromProperty('[]',property.items, property.items.minItems && property.items.minItems > 0, schema);
		    }
		    fieldset.appendChild(subItem);
		}
		if (required)
		    makeRequired(fieldset);
		wrapper.appendChild(fieldset);
		return wrapper; // return early because object fields are handled recursively
	    }
	} else if (property.type === 'object') {
	    label.style.display = "none";
            // Recursively create form elements for nested objects
            const fieldset = document.createElement('fieldset');
            const legend = document.createElement('legend');
            legend.textContent = property.title || key;
            fieldset.appendChild(legend);
	    if(property.properties) { 
		Object.keys(property.properties).forEach(function(subKey) {
		    let subProperty = property.properties[subKey];
		    if(subProperty.$ref) {
			subProperty = resolveRef(subProperty.$ref, subProperty, schema);
		    }
		    const subRequired = property.required && property.required.includes(subKey);
		    const subInput = createInputFromProperty(subKey, subProperty, subRequired, schema);
		    fieldset.appendChild(subInput);
		});
		if (required) {
		    makeRequired(fieldset);
		}
		wrapper.appendChild(fieldset);
	    }
            return wrapper; // return early because object fields are handled recursively
	} else {
            input = document.createElement('input');
            input.setAttribute('type', 'text'); // Fallback for unsupported types
	}
	input.setAttribute('name', key);
	if (property.enum) {
	    if(property.enum.length > 1) {
		input = document.createElement('select');
		input.appendChild(new Option("Select..",""));
		property.enum.forEach(value => input.appendChild(new Option(value,value)));
	    } else {
		input.setAttribute('readonly',true);
		input.value = property.enum[0];
		input.style.border = "1px solid #333";
		input.style.background = "#eee";
	    }
	}
	if (required) 
	    makeRequired(input);
	if(property.pattern && regexUpgrade(property.pattern)) 
	    input.setAttribute("pattern", regexUpgrade(property.pattern));
	if(property.description)
	    input.setAttribute("title", property.description);
	wrapper.appendChild(input);
	if(property.examples) {
	    let example = document.createElement('select');
	    example.setAttribute("data-exclude","example");
	    example.appendChild(new Option("Example entries:",""));
	    property.examples.forEach(ex => example.appendChild(new Option(ex,ex)));
	    example.style.marginLeft = "0.2em";
	    example.setAttribute("onchange","exampleFill(this)");
	    wrapper.appendChild(example);
	}
	return wrapper;
    }
    function exampleFill(el) {
	if(el.value)
	    el.previousElementSibling.value = el.value;
    }
    function createFormFromSchema(schema, parentElement) {
	const form = document.createElement('div');
	form.setAttribute('id', schema.title ? schema.title.toLowerCase().replace(/\s+/g, '-') + '-form' : 'dynamic-form');
	if(schema.oneOf) {
	    const selectEl = document.createElement('select');
	    selectEl.setAttribute("data-exclude","oneOf");
	    selectEl.addEventListener(
		'change',
		function() {
		    let show = document.getElementById(this.options[this.selectedIndex].value);
		    if(show) {
			parentElement.querySelectorAll(".selectEl")
			    .forEach( x => x.style.display = "none");
			show.style.display = "block";
		    }
		},
		false
	    );
	    const definitions = schema.definitions;
	    schema.oneOf.forEach((schema,i) => {
		/* If definitions exists copy them over to schema subschema*/
		if(definitions)
		    schema.definitions = definitions;
		const oneElement = document.createElement('div');
		oneElement.id = schema.title || ('selectEl' + String(i));
		if(i > 0) 
		    oneElement.style.display = "none";
		oneElement.className = "selectEl";
		parentElement.appendChild(oneElement);
		createFormFromSchema(schema, oneElement);
		selectEl.appendChild(new Option(oneElement.id, oneElement.id));
	    });
	    parentElement.prepend(selectEl);
	    return;
	}
	if(schema.properties) {
            Object.keys(schema.properties).forEach(key => {
		let property = schema.properties[key];

		// Resolve $ref if it exists
		if (property.$ref) {
                    property = resolveRef(property.$ref, property, schema);
		}

		const required = schema.required && schema.required.includes(key);
		const inputElement = createInputFromProperty(key, property, required, schema);
		form.appendChild(inputElement);
            });
	}
	parentElement.appendChild(form);
	/* Add field designation in Object-Oriented form */
	parentElement.querySelectorAll('input,select:not([data-exclude])').forEach(elToField);
	/* Add field desgination i OO form to fieldset that are arrays */
	parentElement.querySelectorAll("[data-counter='0']").forEach(elToField);
	/* Ensure not required fieldset are added only as needed*/
	parentElement.querySelectorAll('fieldset:not([data-required])')
	    .forEach(el => el.querySelector('div').style.display = "none");
	
    }
    async function initializeForm(schemaUrl, elementId) {
	const schema = await fetchObj(schemaUrl);
	const dElement = document.getElementById(elementId);
	if (schema && dElement) {
	    main.dElement = dElement;
            createFormFromSchema(schema, dElement);
	} else {
            document.getElementById(elementId).textContent = 'Failed to load schema.';
	}
    }
    function toData() {
	let fobj = {};
	main.dElement.querySelectorAll('input,select[data-path]:not([data-exclude])').forEach( function(el) {
	    if(!el.checkVisibility())
		return;
	    let val = el.value;
	    if(el.type == "checkbox") {
		if(el.checked) 
		    val = true;
		else
		    val = false;
	    } 
	    /* If val is empty or set to be False for a not required element */
	    if(!val)
		if(!el.hasAttribute("data-required"))
		    return;
	    let x = fobj;
	    let prop = el.getAttribute("data-path");
	    console.log(x);
	    if(!prop)
		return;
	    let props = prop.split(".");
	    if(!props.length)
		return;
	    let fprop = props.pop();
	    for(var i=0; i<props.length; i++) {
		if(props[i] in x) {
		    x = x[props[i]];
		    continue;
		} else {
		    if(i+1 < props.length) {
			if (props[i+1].match(/^\d+$/))
			    x[props[i]] = [];
			else
			    x[props[i]] = {};
		    } else if (fprop.match(/^\d+$/))  {
			x[props[i]] = [];
		    } else {
			x[props[i]] = {};
		    }
		    x = x[props[i]];
		}
	    }
	    if(val === undefined) {
		if (fprop.match(/^\d+$/)) {
		    x.splice(parseInt(fprop),1);
		} else {
		    delete x[fprop];
		}
	    } else {
		x[fprop] = val;
	    }
	});
	return fobj;
    }
    function hideNotRequired() {
	document.querySelectorAll('fieldset:not([data-required])').forEach(x => x.style.display = "none");
    }
    initializeForm(schemaUrl, elementId);
    main.populate = populate;
    main.toData = toData;
    return main;
}
