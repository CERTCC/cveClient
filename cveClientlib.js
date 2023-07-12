class cveClient {
    constructor(org,user,key,url) {
	this.org = org;
	this.user = user;
	this.key = key;
	this.url = url;
	this.user_path = "/org/" + this.org + "/user/" + this.user;
	this._version = "1.0.14";
    }
    publishadp(cve,adp) {
	let path = "/cve/" + cve + "/adp";
	let opts = {method: "PUT"};
	return this.putjson(path,opts,null,adp);
    }
    publishcve(cve,cnajson,update,rejected) {
	/* Create or Update a CVE */
	let opts = null;
	if(update)
	    opts = {method: "PUT"};
	let path = "/cve/" + cve + "/cna";
	if(rejected)
	    path = "/cve/" + cve + "/reject";
	return this.putjson(path,opts,null,{cnaContainer:cnajson});
    }
    reservecve(amount,cve_year,batch_type) {
	let path = "/cve-id/";
	let opts = {method: 'POST'};
	let valid_batch_types = {"nonsequential":1,"sequential":1};
	let qvars = {amount: amount ? amount: 1,
		     short_name:this.org,
		     cve_year: cve_year ? cve_year : new Date().getFullYear()};
	if(amount > 1) {
	    if(batch_type && batch_type in valid_batch_types) {
		qvars['batch_type'] = batch_type;
	    } else {
		qvars['batch_type'] = "sequential";
	    }
	};
	return this.putjson(path,opts,qvars);
    }
    getcvedetail(cve) {
	return this.getjson("/cve/" + cve);
    }
    getcve(cve) {
	return this.getjson("/cve-id/" + cve);
    }
    getcvefilter(year,state,reserved_before,reserved_after,
		 modified_before,modified_after) {
	let qvars = {};
	let path = "/cve-id/";
	let arg_map = ["cve_id_year","state","time_reserved.lt",
		       "time_reserved.gt","time_modified.lt",
		       "time_modified.gt"];
	let largs = arguments;
	arg_map.forEach(function(f,i) {
	    if(largs[i])
		qvars[f] = largs[i];
	});
	return this.getjson(path,null,qvars);
    }
    getquota() {
	return this.getjson("/org/" + this.org + "/id_quota");
    }
    
    getcveids(cve,opts,qvars) {
	let path = "/cve-id/";
	if(cve)
	    path = path + cve;
	return this.getjson(path,opts,qvars);
    }
    getuser(username) {
	let path = this.user_path;
	if(username)
	    path = "/org/"+ this.org + "/user/" + username;
	return this.rfetch(path);
    }
    resetuser(username) {
	let path = this.user_path+"/reset_secret";
	if(username)
	    path = "/org/" + this.org + "/user/" + username + "/reset_secret";
	return this.putjson(path,{method:'PUT'});
    }
    createuser(userdata) {
	let path = "/org/" + this.org + "/user";
	return this.putjson(path,null,null,userdata);
    }
    updateuser(username,userdata) {
	if(!username)
	    username = this.user;
	let path = "/org/" + this.org + "/user/" + username;
	return this.putjson(path,{method:'PUT'},userdata,null);
    }
    listusers(path,opts,qvars) {
	/* Overwrite the path variable */
	path = "/org/" + this.org + "/users";
	return this.getjson(path,opts,qvars);
    }
    getorg(worg) {
	if(!worg)
	    worg = this.org;
	let path = "/org/" + worg;
	return this.getjson(path);
    }
    gethealth() {
	try { 
	    return this.rfetch("/health-check");
	} catch(err) {
	    return {"error": err};
	}
    }
    getjson(path,opts,qvars) {
	return this.rfetch(path,opts,qvars).then(function(j) {
	    return j.json();
	});
    }
    putjson(path,opts,qvars,pvars) {
	if(!opts) 
	    opts = {method: 'POST'};
	if(!('headers' in opts))
	    opts.headers = {};
	opts.headers["Content-Type"] = 'application/json';
	if(pvars)
	    opts.body = JSON.stringify(pvars);
	return this.rfetch(path,opts,qvars).then(function(j) {
	    return j.json();
	});
    }    
    rfetch(path,opts,qvars) {
	let url = new URL(this.url);
	url.pathname = url.pathname + path;
	if(!opts) {
	    opts = {method:'GET'};
	}
	if(qvars) { 
	    var qstr = new URLSearchParams();
	    Object.keys(qvars).forEach(function(x) {
		/* Remove empty values in query_string 
		   strange issue #11 when changing user's information
		   see https://github.com/CERTCC/cveClient/issues/11
		 */
		if(qvars[x] != "") 
		    qstr.append(x,qvars[x]);
	    });
	    url.search = qstr.toString();
	}
	if(!('headers' in opts))
	    opts.headers = {};	
	opts.headers = Object.assign({},opts.headers,
				     {'CVE-API-KEY': this.key,
				      'CVE-API-ORG': this.org,
				      'CVE-API-USER': this.user });
	return fetch(url.toString(),opts).then(function(r) {
	    return r;
	}); 
    }
}
