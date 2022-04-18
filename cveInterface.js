const _version = "1.0.3";
const _tool = "CVE Services Client Interface "+_version;
const _cna_template =  {"affected": [ { "version": "${version}", "defaultStatus": "affected", "product": "${product}", "vendor": "${vendor|client.orgobj.name}" } ], "descriptions": [ { "lang": "en", "value": "$description" } ], "providerMetadata": { "orgId": "$client.userobj.org_UUID", "shortName": "$client.org" }, "references": [ { "name": "$cve", "url": "$url" }]};
let store;
let store_tag = "cveClient/";
/* User var to access client as window.client global var */
var client;

function add_option(w,f) {
    $(w).append($('<option/>').attr({value:f.toString(),selected:1})
		.html(f.host));
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
		add_option(w,f);
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
function swal_error(err_msg) {
    Swal.fire({
	title: "Error!",
	text: err_msg,
	icon: "error",
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
		add_option(x,new URL(val));
	    }
	});
	client = new cveClient($('#org').val(),$('#user').val(),$('#key').val(),$('#url').val());
	console.log("Here");
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
	$('#addUserModal .active').prop({checked:false}).removeClass('enabled');
	$('#addUserModal span.round').prop({title:'Inactive'});	
	$('#addUserModal span.uspan').removeClass('text-primary')
	    .addClass('text-danger').html(' [Inactive] ');
    }
}
function user_update_modal(mr) {
    $('#addUserModal').modal();
    $('#addUserModal').removeClass("addUser").addClass("updateUser");
    $('#addUserModal .mtitle').html("Update User ("+mr.username+")");
    $('#addUserModal .username').val(mr.username).data('oldvalue',mr.username);
    if('name' in mr) {
	if('first' in mr.name)
	    $('#addUserModal .name_first').val(mr.name.first).data('oldvalue',mr.name.first);
	if('last' in mr.name)
	    $('#addUserModal .name_last').val(mr.name.last).data('oldvalue',mr.name.last);
    }
    
    if('active' in mr)
	user_active_view(mr.active);
    if(mr.authority.active_roles.length) {
	/* Handle user roles currently only ADMIN or Nothing*/
	let vroles = mr.authority.active_roles.join(",")
	('#addUserModal .active_roles').val(vroles).data('oldvalue',vroles);
    }
    $('#addUserModal .form-control').change(function() {
	checkchange(this);
    });
}
function checkchange(w) {
    console.log(w);
}
function cve_update_modal() {

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
    let pmd = {state: "UNKNOWN"};
    let clm = [{field:'cve_id', title:'CVE',sortable: true},
	       {field: 'state', title: 'State',sortable: true}];
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
function updateuser() {
    //await client.updateuser('rajo@sendmail.org',{'active_roles.remove':'ADMIN'})
    //await client.updateuser('rajo@sendmail.org',{'active_roles.add':'ADMIN'})
    var row = $('#deepDive').data('crecord');
    let updates = {};
    $('#addUserModal .form-control').each(function(_,x) {
	//console.log($(x).data('update'));
	//console.log(x.name);
    });
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
    let role = $('#addUserModal .role').val();
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
