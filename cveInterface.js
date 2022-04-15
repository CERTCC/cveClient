let client;
let store;
let store_tag = "cveClient/";
const _version = "1.0.2"
const _tool = "CVE Services Client Interface "+_version

function add_option(w,f) {
    $(w).append($('<option/>').attr({value:f.toString(),selected:1})
		.html(f.host));
}
function show_alert(lvl,msg,tmr) {
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
	swal_error("Login failed. Perhaps Network error. See console for details!")
	return;
    };
    let messages = "Unknown";
    let title = "CVE CNA Login";
    let mtype = "error";
    try {
	let rtext = await d.json();	
	if("name" in rtext) {
	    messages = "Welcome "+rtext.name.first+" "+rtext.name.last;
	    client.userobj = rtext;
	} else if("message" in rtext) {
	    messages = rtext.message;
	} else if("error" in rtext) {
	    messages = rtext.error;
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
		client.userobj = y

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
    if(r.new) {
	return {
	    classes: 'hnew'
	};
    };
    return {classes: 'normal'};
}
function doRefresh() {
    let tableid = $('#svTab a.active').data('tableid')
    client[tableid].bootstrapTable('destroy');
    $('#svTab a.active').parent().find('a.refresh').click();
}
function objwalk(h,d,r,s) {
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
	    .append($("<tr>")
		    .append($("<td>").html($("<div>")
					   .text(dp).html()))
		    .append($("<td>").html($("<div>")
					   .text(r[d]).html()))).html();
    }
}
function deepdive(_, _, row, el) {
    console.log(el);
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
    $('#deepDive').modal();
}
async function show_table(fun,msg,tag,fld,pmd,clm,tbn,uid,show) {
    if(show) {
	if(tbn in client) {
	    show_alert("success","Showing Cached data. If needed click on Refresh Icon.",1000);
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
	    var tempm = JSON.parse(JSON.stringify(pmd));
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
    if(!name.first) {
	if(!name.last) 
	    return row.username;
	else
	    return name.last;
    }
    if(!name.last)
	return name.first;
    return name.first + " " + name.last;
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
    if($('#addUserModal .username').is(':checked')) 
	usermodel['active'] = true;
    else
	usermodel['active'] = false;
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
	Swal.fire({
	    title: "User Created",
	    text: f.message,
	    icon: "success",
	    timer: 1800
	}).then(function() {
	    show_users_table();
	    $('#users-tab').click();
	    setTimeout(function() {
		var mf = client.usertable
		    .bootstrapTable('getRowByUniqueId',username);
		mf.new = 1;
		client.usertable
		    .bootstrapTable('updateByUniqueId',{id: username,
							row: mf,
							replace:true});
		
	    },1000);
	});
    }
    $('#addUserModal').modal('hide');
    console.log(f);
}
