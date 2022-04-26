const _version = "1.0.5";
const _tool = "CVE Services Client Interface "+_version;
const _cna_template = { "descriptions": [ { "lang": "${descriptions.0.lang}", "value": "${descriptions.0.value}"} ] ,  "affected": [ { "versions": [{"version": "${affected.0.versions.0.version}"}], "product": "${affected.0.product}", "vendor": "${affected.0.vendor|client.orgobj.name}" } ],"references": [ { "name": "${references.0.name}", "url": "${references.0.url}" }], "providerMetadata": { "orgId": "${client.userobj.org_UUID}", "shortName": "${client.org}" } }
const valid_states = {PUBLISHED: 1,RESERVED: 1, REJECTED: 1};
let store;
let store_tag = "cveClient/";
/* User var to access client as window.client global var */
var client;

function add_option(w,v,f,s) {
    $(w).append($('<option/>').attr({value:v,selected:s})
		.html(f));
}
function show_field(w) {
    var fclass = $(w).data("show");
    $('.'+fclass).toggleClass("d-none");
    $(w).toggleClass("arrowdown");
}
function load_languages() {
    $.getJSON("language-codes.json").done(function(d) {
	var langs = d;
	if("langs" in d)
	    langs = d.langs;
	for(var i=0; i<langs.length; i++) {
	    if('alpha2' in langs[i]) {
		if(langs[i].alpha2 == "en")
		    continue;
		if('English' in langs[i]) {
		    var tf = langs[i].English.split(';');
		    for(var j=0; j<tf.length; j++) 
			add_option($('.lang'),langs[i].alpha2,
				   tf[j] + "(" + langs[i].alpha2 + ")");
		} else
		    add_option($('.lang'),langs[i].alpha2,langs[i].alpha2);
	    }
	}
    });
}
function json_edit(vjson) {
    let editor = ace.edit("mjsoneditor");
    editor.setTheme("ace/theme/xcode");
    editor.session.setMode("ace/mode/json");
    editor.session.setUseWrapMode(true);
    editor.setValue(vjson);
    from_json();
    if(!$('#nice').hasClass("active"))
	$('#nice-tab').click();
}
function get_deep(obj,prop) {
    /* Check if Object obj has all the dot-delimited properties 
     recursively. example get_deep({a:{b:{c:{"good"}}}},"a.b.c") 
    will return good */
    if(typeof(obj) != "object")
	return undefined;
    let props = prop.split(".");
    var x = obj;
    for(var i=0; i<props.length; i++) {
	if(props[i] in x)
	    x = x[props[i]];
	else
	    return undefined;
    }
    return x;
}
function set_deep(obj,prop,val) {
    /* For the Object obj set the property of a prop to val 
     recursively. example set_deep({a:{b:{c:{"good"}}}},"a.b.c","bad") 
    will return {a:{b:{c:{"bad"}}}} */
    if(typeof(obj) != "object")
	return undefined;
    let fobj = simpleCopy(obj);
    var x = fobj;
    let props = prop.split(".");
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
		/* Last element and is an array */
		x[props[i]] = [];
	    } else {
		x[props[i]] = {};
	    }
	    x = x[props[i]];
	}
    }
    x[fprop] = val;
    return fobj;
}

function simpleCopy(injson) {
    return JSON.parse(JSON.stringify(injson));
}
function selectpass(passid) {
    var copyText = document.getElementById(passid);
    if(!copyText) return;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    $('#error_div').html("Password copied to clipboard!").
	removeClass().addClass("warn success").show().fadeOut(2000);
}
function duplicate(pe) {
    /* Label has only one class just copy it*/
    let pclass = $(pe).data('rclass');
    let childclass = "." + pclass;
    let nrow = $(pe).parent().find(childclass).clone().removeClass(pclass);
    let offset = $(pe).find(".erow").length;
    nrow.find(".form-control").each(function(_,p) {
	let rv = $(p).data('field');
	if(!rv) return;
	rv = rv.replace(/\.(\d+)\.([^\d]+)+$/,function(s0,s1,s2) {
	    try { 
		return '.' + String(offset) + '.' + s2;
	    } catch(err) {
		console.log(err);
		console.log("Error while incrementing data-field id");
		return s0;
	    };
	});
	$(p).attr("data-field",rv);
	/* jquery data() method is distinct from data- fields so do both*/
	$(p).data("field",rv);
    });
    $(pe).append(nrow);
}
function unduplicate(pe) {
    $(pe).remove();
}
function data_selector(el,dfield,dvalue) {
    let sel = '[data-' + dfield + '="' + dvalue + '"]';
    return $(el+sel);
}
function top_alert(lvl,msg,tmr) {
    $('#topalert').addClass("alert alert-"+lvl).html(msg).fadeIn();
    if(tmr)
	setTimeout(function() {
	    $('#topalert').fadeOut();
	},tmr);
}
function urlprompt(w) {
    if($(w).val() == "custom") {
	$('#loginModal').removeAttr("tabindex");
	Swal.fire({
	    title: 'Enter API URL',
	    input: 'text',
	    inputLabel: 'API URL',
	    inputPlaceholder: 'API URL',
	    showCancelButton: true,
	    inputValidator: function(value) {
		if (!value) {
		    return 'You need to write something!';
		}
		try {
		    var f= new URL(value)
		} catch(err) {
		    return 'URL is invalid';
		}
		add_option(w,f.toString(),f.host,1);
		$('#loginModal').attr("tabindex","-1");		
	    }
	});
    }
}
function saveUserOrgInfo(userobj) {
    client.userobj = userobj;
    try {
	/* Collect org information async */
	client.getorg().then(function(y) {
	    client.orgobj = y
	});
    }catch(err) {
	console.log("Error while fetching User's organization");
	console.log(err);
    };
}
    
async function login() {
    let vids = ['org','user','key'];
    for(var i=0; i < vids.length; i++) {
	var el = $('#'+vids[i]);
	if(!el.val()) {
	    el.addClass("is-invalid");
	    return;
	}
    }
    client = new cveClient($('#org').val(),$('#user').val(),$('#key').val(),$('#url').val());
    let d;
    try {
	d = await client.getuser();
    }catch(err) {
	console.log(err);
	swal_error("Login failed. Perhaps Network error. See console for details!");
	return;
    };
    let messages = "Unknown";
    let title = "CVE CNA Login";
    let mtype = "error";
    try {
	let robj = await d.json();	
	if("name" in robj) {
	    messages = "Welcome "+robj.name.first+" "+robj.name.last;
	    saveUserOrgInfo(robj);
	} else if("message" in robj) {
	    messages = robj.message;
	} else if("error" in robj) {
	    messages = robj.error;
	}
    } catch(err) {
	console.log("Could not find json text");
	console.log(err);
    }
    if(d.status == 401) {
	title = "Login Failed!";
	if(messages == "Unknown")
	    messages = 'Perhaps your API key is wrong';
    }
    else if(d.status == 200) {
	mtype = "success";
	title = "Login Success";
	setTimeout(function() {
	    Swal.close();
	    $('#loginModal').modal('hide');
	    show_cve_table();
	}, 2300);
	if ($('#storeLocal').is(':checked')) {
	    store = localStorage;
	} else {
	    store = sessionStorage;
	}
	$('#loginModal .form-control').each(function(_,x) {
	    store.setItem(store_tag+$(x).attr('id'),$(x).val());
	});
    } else {
	title = "Unspecified Error!";
	if(messages == "Unknown")
	    messages = "Unknown error! See console for more information";
	console.log(d);
    }
    Swal.fire({
	title: title,
	text: messages,
	icon: mtype,
	confirmButtonText: 'OK'
    });
}
function logout() {
    Swal.fire({
	title: 'Are you sure?',
	showDenyButton: true,
	showCancelButton: false,
	confirmButtonText: 'Logout',
	denyButtonText: 'Cancel',
    }).then((result) => {
	if (result.isConfirmed) {
	    sessionStorage.clear();
	    localStorage.clear();
	    location.reload();
	} else if (result.isDenied) {
	    console.log("User is still on");
	}
    });
}
function swal_error(err_msg,err_type) {
    if(!err_type)
	err_type = "error";
    Swal.fire({
	title: "Error!",
	text: err_msg,
	icon: err_type,
	confirmButtonText: "OK"
    });
}
$(function() {
    store = null;
    if(localStorage.getItem(store_tag+"url")) {
	store = localStorage;
    } else if(sessionStorage.getItem(store_tag+"url")) {
	store = sessionStorage;
    }

    if (store == null) {
	$('#loginModal').modal();
    } else {
	$('#loginModal .form-control').each(function(_,x) {
	    var vid = $(x).attr('id');
	    var val = store.getItem(store_tag+vid);
	    $(x).val(val);
	    if($(x).val() != val) {
		let f = new URL(val);
		add_option(x,f.toString(),f.host,1);
	    }
	});
	client = new cveClient($('#org').val(),$('#user').val(),$('#key').val(),$('#url').val());
	client.getuser().then(function(x) {
	    x.json().then(function(y) {
		if('error' in y) {
		    swal_error("Error while logging in: "+y.error+" "+y.message);
		    return;
		} else {
			show_cve_table();
		}
		saveUserOrgInfo(y);		
	    });
	}).catch(function(err) {
	    console.log(err);
	    swal_error("Automatic Login failed! "+
		       "If credentials have changed"+
		       ", please logout and refresh"+
		       " for a new login");	    
	});
	load_languages();
    }
});
async function get_pages(m,tag,fld,tbn,fun) {
    for(var i=m.itemsPerPage; i< m.totalCount; i = i + m.itemsPerPage) {
	let ipage = Math.floor(i/m.itemsPerPage)+1;
	let x = await client[fun](null,null,{page:ipage});
	for(var j=0; j<x[fld].length; j++) {
	    client[tbn].bootstrapTable('updateByUniqueId',{
		id: tag + String(i+j),
		row: x[fld][j]
	    });
	}
    }
}
function rowStyle(r) {
    if(r.warn) {
	return {
	    classes: 'hwarn'
	};
    }
    if(r.new) {
	return {
	    classes: 'hnew'
	};
    };
    return {classes: 'normal'};
}
function doRefresh() {
    let tableid = $('#svTab a.active').data('tableid');
    client[tableid].bootstrapTable('destroy');
    $('#svTab a.active').parent().find('a.refresh').click();
}
function objwalk(h,d,r,s) {
    /* add a Class to some of the rows */
    let rowClass = "normal";
    if(d in {"new":1,"warn":1}) {
	rowClass = "h"+d;
	/* Unique case of internal data no need to display it */
	if(r[d] == 1) 
	    return h
    }
    if(d in {"secret":1,"password": 1, "API-secret": 1,"API-key":1})
	rowClass = "hdanger";
    if(typeof(r[d]) == "object") {
	let mr = r[d];
	let f = Object.keys(mr).reduce(function(hr,dr) {
	    return objwalk(hr,dr,mr,d);
	},"");
	return h+f;
	
    } else {
	if(!r[d])
	    return h;
	dp = d;
	if(s)
	    dp = s + "/" + d;
	return h + $("<div>")
	    .append($("<tr>").addClass(rowClass)
		    .append($("<td>").html($("<div>")
					   .text(dp).html()))
		    .append($("<td>").html($("<div>")
					   .text(r[d]).html()))).html();
    }
}
function deepdive(_, _, row, el) {
    try {
	var tinfo = el.closest('tr').data('uniqueid');
	if(tinfo)
	    $('#detailtag').html("("+tinfo+")");
	else
	    $('#detailtag').html('');
    } catch(err) {
	console.log("Ignore this error");
	$('#detailtag').html('');	
    }
    /* for CVE record we only support RESERVED state 
     to move to PUBLISHED at this time. Update is not 
     available */
    if("username" in row)
	$('#updaterecord').html("Update User");
    else if(("cve_id" in row) && ("state" in row)) {
	$('#cveUpdateModal .mtitle').html("("+row.cve_id+")");
	if (row.state == "RESERVED") {
	    $('#updaterecord').html("Edit & Publish CVE").show();
	    $('#cveUpdateModal .cveupdate').html("Publish CVE");
	} else if (row.state == "PUBLISHED") {
	    $('#updaterecord').html("Update CVE").show();
	    $('#cveUpdateModal .cveupdate').html("Update CVE");
	} else {
	    $('#updaterecord').hide();
	}
    } else 
	$('#updaterecord').hide();
    var html =  Object.keys(row).reduce(function(h,d) {
	return objwalk(h,d,row);
    },"<table class='table table-striped'><tbody>");
    $('#deepDive .modal-body').html(html);
    $('#deepDive').data('crecord',row);
    $('#deepDive').modal();
}
function add_user_modal() {
    $('#addUserModal').modal();
    $('#addUserModal form').trigger('reset');
    $('.addUserModal .form-control').removeClass('is-valid is-invalid');
    $('#addUserModal').removeClass("updateUser").addClass("addUser");
    if(!('usertable' in client)) {
	console.log("Creating users table in the background");
	show_users_table();
	$('#users-tab').tab('show');
    }
}
function user_active_view(active) {
    if(active) { 
	$('#addUserModal .active').prop({checked:true}).addClass('enabled');
	$('#addUserModal span.round').prop({title:'Active'});
	$('#addUserModal span.uspan').removeClass('text-danger')
	    .addClass('text-primary').html(' [Active] ');
    } else {
	$('#addUserModal .active').prop({checked:false})
	    .removeClass('enabled');
	$('#addUserModal span.round').prop({title:'Inactive'});	
	$('#addUserModal span.uspan').removeClass('text-primary')
	    .addClass('text-danger').html(' [Inactive] ');
    }
}
function user_update_modal(mr) {
    $('#addUserModal').modal();
    $('#addUserModal').removeClass("addUser").addClass("updateUser");
    /* update button remains hidden until some values change in the form*/
    $('#updateButton').hide();
    $('#addUserModal .mtitle').html("Update User ("+mr.username+")");
    $('#addUserModal .username').val(mr.username).data('oldvalue',mr.username);
    $('#addUserModal .form-control').removeClass('is-valid is-invalid');    
    if('name' in mr) {
	if('first' in mr.name)
	    $('#addUserModal .name_first').val(mr.name.first)
	    .data('oldvalue',mr.name.first);
	if('last' in mr.name)
	    $('#addUserModal .name_last').val(mr.name.last)
	    .data('oldvalue',mr.name.last);
    }
    
    if('active' in mr)
	user_active_view(mr.active);
    if(mr.authority.active_roles.length) {
	/* Handle user roles currently only ADMIN or Nothing*/
	let vroles = mr.authority.active_roles.join(",")
	$('#addUserModal .active_roles').val(vroles).data('oldvalue',vroles);
    } else {
	$('#addUserModal .active_roles').val('');
    }
}
function checkchange(w) {
    if(get_deep(w,'validity.valid') != undefined) {
	if(w.validity.valid == false) 
	    $(w).removeClass('is-valid').addClass('is-invalid');
	if (w.validity.valid == true)
    	    $(w).removeClass('invalid').addClass('is-valid');
    }
    if($('#addUserModal').hasClass("updateUser")) {
	if(($(w).data('oldvalue') != $(w).val()) && $(w).hasClass('is-valid'))
	    $('#updateButton').show();
    }
}
function vreplace(s,v) {
    var vr = v.split("|");
    for(var i=0; i<vr.length; i++) {
	let ret = get_deep(window,vr[i]);
	if(ret)
	    return ret;
    }
    return s
}
async function cve_update_modal() {
    $('#cveform .form-control').removeClass('is-valid');
    /* remove all additional fields */
    $('#cveform ol > li.erow:nth-of-type(n+2)').remove();
    $('#cveform').trigger('reset');
    $('#cveUpdateModal').modal();
    var mr = $('#deepDive').data('crecord');
    if(('state' in mr) && (mr.state == 'PUBLISHED')) {
	let c = await client.getcvedetail(mr.cve_id);
	console.log(c);
	if(('containers' in c) && (c.containers.cna))
	    json_edit(JSON.stringify(c.containers.cna,null,3));
	else if('error' in c)
	    swal_error("Error in fetching details of CVE "+c.error+" : "+
		       c.message);
	else
	    swal_error("Unknown error when fetching details of CVE. "+
		       "See console log for details");
    } else {
	let mjson = JSON.stringify(_cna_template,null,2)
	    .replace(/\$\{([^\}]+)\}/g,vreplace);
	json_edit(mjson);
    }
}
function mupdate() {
    var mr = $('#deepDive').data('crecord');
    if(!mr)
	return;
    $('#deepDive').modal('hide');
    if('username' in mr) {
	user_update_modal(mr);
    } else {
	cve_update_modal(mr);
    }
}
async function show_table(fun,msg,tag,fld,pmd,clm,tbn,uid,show) {
    if(show) {
	if(tbn in client) {
	    top_alert("success","Showing Cached data. If needed click on Refresh Icon.",1000);
	    return;
	}
    }
    let m;
    try {
	m = await client[fun]();
    } catch(err) {
	swal_error("Error in collecting data, potentially network error!");
	console.log(err);
	return;
    }
    if(!(fld in m)) {
	Swal.fire({
	    title: "No data to display!",
	    text: msg,
	    icon: "warning",
	    confirmButtonText: "OK",
	    timer: 1800
	});
	return;
    }
    /* totalCount itemsPerPage pageCount currentPage prevPage nextPage */
    if(('totalCount' in m) && (m.totalCount > m[fld].length)) {
	for(var i=m[fld].length; i<m.totalCount; i++) {
	    var tempm = simpleCopy(pmd);
	    tempm[uid] = tag + String(i);
	    m[fld].push(tempm);
	}
    }
    client[tbn] = $('#'+tbn).bootstrapTable({
	columns: clm,
	uniqueId: uid,
	striped: true,
	pagination: true,
	paginationVAlign: 'both',
	searchOnEnterKey: false,
	pageSize: 20,
	pageList: [20,50,100],
	search: true,
	showHeader: true,
	showColumns: false,
	showRefresh: true,
	onRefresh: function() {
	    doRefresh(tbn);
	},
	onClickCell: deepdive, 
	sortable:true,
	rowStyle: rowStyle,
	data: m[fld]
    });
    if(m.nextPage) 
	get_pages(m,tag,fld,tbn,fun);
}
function gname(name,row) {
    var append = "";
    if(row.secret)
	append = " &#128273 ";
    if(!name.first) {
	if(!name.last) 
	    return row.username + append;
	else
	    return name.last + append;
    }
    if(!name.last)
	return name.first + append;
    return name.first + " " + name.last + append;
}
function gsort(name1,name2,row1,row2) {
    let nameA = gname(name1,row1).toUpperCase();
    let nameB = gname(name2,row2).toUpperCase();
    if (nameA < nameB) {
	return -1;
    }
    if (nameA > nameB) {
	return 1;
    }
    return 0;
}
function show_users_table(show) {
    let fun = "listusers";
    let tag = "USER-";
    let fld = "users";
    let uid = "username";
    let tbn = "usertable";
    let msg = "No Users to display";
    let pmd = {active: "UNKNOWN"};
    let clm = [{field:'name', title:'Full name', formatter: gname,sortable:true,sorter:gsort},
	       {field:'username', title:'Username',sortable: true},
	       {field: 'active', title: 'Active',sortable: true}];
    show_table(fun,msg,tag,fld,pmd,clm,tbn,uid,show);    
}
function show_cve_table(show) {
    let fun = "getcveids";
    let tag = "CVE-9999-";
    let fld = "cve_ids";
    let uid = "cve_id";
    let tbn = "cvetable";
    let msg = "No CVE data to display";
    let pmd = {state: "UNKNOWN",reserved: (new Date(0)).toISOString()};
    let clm = [{field:'cve_id', title: 'CVE', sortable: true},
	       {field: 'state', title: 'State', sortable: true},
	       {field: 'reserved', title: 'Date', sortable: true}];
    show_table(fun,msg,tag,fld,pmd,clm,tbn,uid,show);
}
async function reserve() {
    let vars = {};
    $('#reserveCVEModal .form-control').each(function(_,x) {
	vars[x.name] = $(x).val();
    });
    $('#reserveCVEModal').modal('hide');
    let y = await client.reservecve(vars.amount,vars.cve_year,vars.batch_type);
    if("error" in y) {
	swal_error("Error while logging in: "+y.error+" "+y.message);
	return;
    } else if('cve_ids' in y) {
	Swal.fire({
	    title: "CVE Reserve success!",
	    text: "Reserved " + y.cve_ids.length+" CVE's.",
	    icon: "success",
	    timer: 1800
	});
	for(var i=0; i<y.cve_ids.length; i++) {
	    let new_cve = y.cve_ids[i];
	    new_cve['new'] = 1;
	    client.cvetable.bootstrapTable('insertRow',
					   {index: 0,
					    row: new_cve});
	}
	setTimeout(function() {
	    $('tr.hnew').removeClass('hnew').each(function(_,x) {
		let cve = $(x).data("uniqueid");
		let g = client.cvetable
		    .bootstrapTable('getRowByUniqueId',cve);
		g.new = 0;
		client.cvetable
		    .bootstrapTable('updateByUniqueId',{id: cve,
							row:g,
							replace:true});
	    });
	},2800);
    } else {
	swal_error("Unknown error, see console for details");
	console.log(y);
    }
    
}
async function reset_user(w,confirmed) {
    if(!confirmed) { 
	Swal.fire({
	    title: "Are you sure?",
	    text: "The user's current API-Key will be revoked",
	    showDenyButton: true,
	    showCancelButton: false,
	    confirmButtonText: "Reset",
	    denyButtonText: "Cancel",
	}).then(function(result)  {
	    if (result.isConfirmed) {    
		reset_user(w,true);
	    }
	});
    } else {
	lock_unlock(1,w);
	let username = $('#addUserModal .username').data('oldvalue');
	let d = await client.resetuser(username);
	if("API-secret" in d) {
	    let f = client.usertable
		.bootstrapTable('getRowByUniqueId',username);
	    f.secret = d['API-secret'];
	    f.warn = 1;
	    client.usertable
		.bootstrapTable('updateByUniqueId',{id: username,
						    row: f});
	    set_copy_pass(f.secret);
	    Swal.fire({
		title: "Reset API-Key!",
		text: "API-Key secret has been reset and "+
		    "copied to your clipboard!",
		icon: "success",
		timer: 3800
	    }).then(function() {
		$('#addUserModal').modal('hide');
	    });
	}
	else if("error" in d) 
	    swal_error("Reset failed "+d.error + " : " + d.message);
	else
	    swal_error("Unknown error see console log for details");
	lock_unlock(0,w);
    }
}
function update_user() {
    /* await client.updateuser('rajo@sendmail.org', 
       {'active_roles.remove':'ADMIN'})
       await client.updateuser('rajo@sendmail.org',
       {'active_roles.add':'ADMIN'})
       */
    var row = $('#deepDive').data('crecord');
    let updates = {};
    $('#addUserModal .form-control').each(function(_,x) {
	//console.log($(x).data('update'));
	var field = $(x).data('update');
	if($(x).val() && $(x).data('oldvalue') != $(x).val()) 
	    updates[field] = $(x).val();
    });
    if(Object.keys(updates).length) {
	if('active_roles' in updates && updates.active_roles != "") {
	    updates['active_roles.add'] = updates.active_roles;
	    delete updates.active_roles;
	}
	if(get_deep(row,'authority.active_roles.length')) {
	    /* User has a role check if we need to remove it*/
	    if($('#addUserModal .active_roles').val() == "")  {
		delete updates.active_roles;
		updates['active_roles.remove'] = row.authority
		    .active_roles.join(",");
	    }
	}
	if(('name.first' in updates) || ('name.first' in updates)) {
	    /* We need both values for the child properties of 'name' */
	    updates['name.first'] = $('#addUserModal .name_first').val() || " ";
	    updates['name.last'] = $('#addUserModal .name_last').val() || " ";
	}
	if('new_username' in updates) {
	    Swal.fire({title: "Username Change!",
		       text: "User needs to be notified to login with the "+
		       "new username as "+updates.new_username,
		       icon: "warning",
		       showDenyButton: true,
		       showCancelButton: false,
		       confirmButtonText: "Proceed!",
		       denyButtonText: "Cancel"
		      }).then(function(result)  {
			  if (result.isConfirmed) {    
			      console.log(updates);
			      do_update_user(row.username,updates);
			  }	    
		      });
	} else {
	    do_update_user(row.username,updates);
	}
    } else {
	swal_error("Nothing needs to be updated","warning");
    }
}
async function do_update_user(username,updates) {
    let d = await client.updateuser(username,updates);
    if("error" in d) {
	swal_error("Error in updating user "+d.error+" : "+d.message);
    } else if('updated' in d) {
	let nrow = simpleCopy(d.updated);
	nrow['warn'] = 1;
	client.usertable.bootstrapTable('updateByUniqueId',{id: username,
							    row: nrow});
	Swal.fire({icon: "success",
		   title: "Update Updated!",
		   text: d.message || "Update success.",
		   timer: 2000}).then(function() {
		       $('#addUserModal').modal('hide');
		   });
    } else {
	swal_error("Unknown error, please see console.log for details");
    }
}
function lock_unlock(dolock,w) {
    if(dolock) {
	$('body').css({opacity:0.6});
	if(w) 
	    w.disabled = 1;
    } else {
	$('body').css({opacity:1});
	if(w)
	    w.disabled = 0;
    }
}
async function update_user_status(w) {
    lock_unlock(1,w);
    let username = $('#addUserModal .username').data('oldvalue');
    let model = {};
    model.active = w.checked;
    let d = await client.updateuser(username,model);
    if("error" in d) {
	lock_unlock(0,w);
	swal_error("Error managing user "+username+" "+d.error+" : "+
		   d.message);
    }
    else {
	let f = client.usertable.bootstrapTable('getRowByUniqueId',username);
	f.active = w.checked;
	f.warn = 1;
	user_active_view(f.active);
	client.usertable.bootstrapTable('updateByUniqueId',username,f);
	top_alert("success", "User ("+username+") Active status has been "+
		  "updated to <b>[" + String(f.active)+"]</b>",4000);
	setTimeout(function() {
	    /* Just clear out warning */
	    lock_unlock(0,w);
	    $('#addUserModal').modal('hide');
	},2000);
	setTimeout(function() {
	    f.warn = 0;
	    client.usertable.bootstrapTable('updateByUniqueId',username,f);
	},4000);
    }
    
}
function set_copy_pass(secret){
    $("#cpassword").remove();
    var ppass = $('<input>').val(secret).attr("id","cpassword").
	addClass("passform").on("click",selectpass).
	attr("readonly","readonly");
    $('#addUserModal').append(ppass);
    selectpass("cpassword");
}
async function adduser() {
    let usermodel = {username: "", name: {first:"",last: ""},
		     active: true,authority: {active_roles: []} };
    let username = $('#addUserModal .username').val();
    let fname = $('#addUserModal .name_first').val() || "";
    let lname = $('#addUserModal .name_last').val() || "";
    let role = $('#addUserModal .active_roles').val();
    if(!username) {
	$('#addUserModal .username').addClass('is-invalid');
	return;
    };
    $('#addUserModal .username').removeClass('is-invalid');
    usermodel['username'] = username.toLowerCase();
    usermodel['name'] = { first: fname, last: lname};
    if(role)
	usermodel['authority']['active_roles'].push(role);
    let f = await client.createuser(usermodel);
    if('error' in f) {
	swal_error(f.error + ": " + f.message);
	return;
    }
    if('created' in f) {
	let fn = simpleCopy(f.created);
	fn.new = 1;
	client.usertable.bootstrapTable('insertRow',
				       {index: 0,
					row: fn});
	set_copy_pass(fn.secret);
	Swal.fire({
	    title: "User Created!",
	    text: f.message + " API-Key secret is copied to your clipboard!",
	    icon: "success",
	    timer: 3800
	}).then(function() {
	    $('#users-tab').click();
	    setTimeout(function() {
		fn.new = 0;
		client.usertable
		    .bootstrapTable('updateByUniqueId',{id: username,
							row: fn,
							replace:true});
		
	    },1000);
	});
    }
    $('#addUserModal').modal('hide');
}
function get_json_data() {
    try { 
	return JSON.parse($('#mjson .jsoneditor')[0]
			  .env.editor.getValue());
    } catch (err) {
	console.log(err);
	swal_error("Error in collecting JSON. See console log for details");
	return {};
    }

}
function from_json(w) {
    let json_data = get_json_data();
    if(!json_data)
	return;
    $('#nice .frow').each(function(_,el) {
	var field = $(el).data("rclass");
	if(field in json_data) {
	    let diff = json_data[field].length - $(el).find("> .erow").length;
	    if(diff > 0) {
		/* Add elements */
		for(var i=1; i <= diff; i++) 
		    $(el).find(".addrow").click();
	    } else if (diff < 0) {
		/* Remove elements */
		for(var i=1; i <= Math.abs(diff); i++) 
		    $(el).find(".deleterow").click();		
	    }
	}
    });
    $('#nice .form-control').each(function(_,v) {
	let props = $(v).data("field");
	if(props) { 
	    let oval = get_deep(json_data,props);
	    if(oval && oval[0] != '$') {
		/* Value map exists and does not begin with $ */
		$(v).val(oval);
		if(oval != $(v).val()) {
		    /* In case of select field */
		    add_option(v,oval,oval,1);
		}
		clearoff(v);
	    }
	}
    });
}
async function publish_cve() {
    try { 
	if($('#nice-or-json').find(".active.show").attr("id") == "nice") { 
	    if(to_json() == false) {
		$('#cveform .is-invalid').focus();
		swal_error("Some required fields are missing or incomplete");
		return;
	    }
	}
	let editor = $('#mjson .jsoneditor')[0].env.editor;
	let pubcve = JSON.parse(editor.getValue());
	let mr = $('#deepDive').data('crecord');
	let cve = mr.cve_id;
	let ispublic = mr.state == "PUBLISHED";
	let d = await client.publishcve(cve,pubcve,ispublic);
	if("error" in d) {
	    swal_error("Failed to publish CVE, Error : "+d.error);
	    console.log(d);
	    return;
	}
	if("created" in d) {
	    let note = "Published";
	    if(ispublic)
		note = "Updated";
	    Swal.fire({
		title: "CVE "+note+" Successfully!",
		text: d.message,
		icon: "success",
		timer: 1800
	    });
	    let u = client.cvetable.bootstrapTable('getRowByUniqueId',cve);
	    u.state = get_deep(d,'created.cveMetadata.state');
	    let modified = get_deep(d,'created.cveMetadata.datePublished');
	    if(modified) 
		set_deep(u,'time.modified',modified);
	    u.new = 1;
	    client.cvetable.bootstrapTable('updateByUniqueId',{id: cve,
							       row: u });
	    $('#cveUpdateModal').modal('hide');
	} else {
	    console.log(d);
	    swal_error("Unknown error CVE could not be updated. See console "+
		       " log for details!");
	}
    }catch(err) {
	console.log(err);
	swal_error("Could not publish this CVE. Fix the errors please!");
    }
}
function to_json(w) {
    let json_data = get_json_data();
    let value_check = true;
    $('#nice .form-control').not('.d-none').each(function(_,v) {
	if($(v).val()) {
	    let props = $(v).data("field");
	    if(!props) return;
	    json_data = set_deep(json_data,props,$(v).val());
	    $(v).removeClass('is-invalid').addClass('is-valid');
	} else {
	    value_check = false;
	    $(v).removeClass('is-valid').addClass('is-invalid');
	}
    });
    let editor = $('#mjson .jsoneditor')[0].env.editor;
    editor.setValue(JSON.stringify(json_data,null,2));
    return value_check;
}
function update_related(w) {
    /* Function to update the data-field of a related item*/
    /* data-related="versionRangeValue" data-relatedfield="affected.0.versions.0.$" */
    let related = $(w).data("related");
    if($(w).val()) {
	let field = $(w).data("relatedfield").replace("$",$(w).val());
	$(w).parent().find("."+related).attr("data-field",field);
    } else {
	$(w).parent().find("."+related).removeAttr("data-field");
    }
}
function clearoff(w) {
    if($(w).val() && (get_deep(w,'validity.valid') == true))
	$(w).removeClass('is-invalid').addClass('is-valid');
}
