function autoCompleter(inputElement, suggestionsArray, suggestionUrl, selector, search) {
    /* 
       let autoComplete = autocompleter(document.getElementById("searchInput"),null,"https://democert.org/cveClient/cwe-common.json","cwe-common","templet");
       autoComplete.hoverColor = "#333";
       autoComplete.bgColor = "#000"; // for dark mode 
    */
    "use strict";
    if( !(this instanceof autoCompleter) ){
	return new autoCompleter(...arguments);
    }
    this.hoverColor = "#eee";
    this.bgColor = "#f9f9f9";
    this._version = "1.0.12";
    let main = this;
    if(!inputElement || (!(inputElement.parentElement))) {
	console.error("Error no inputelement found to work with");
	return;
    }
    async function fetch_data(suggestionUrl, searchString) {
	const url = new URL(suggestionUrl);
	if(search) {
	    url.searchParams.delete(search);
	    url.searchParams.append(search, searchString)
	}
	suggestionUrl = url.href;
	const fobj = await fetch(suggestionUrl);
	const data = await fobj.json();
	if(selector && data[selector])
	    return data[selector];
	return data;
    }
    inputElement.parentElement.style.display = "inline-block";
    inputElement.parentElement.style.position = "relative";
    inputElement.addEventListener("click", function(e) {
	closeAllLists(e.target);
    });
    function cleanHTML(content) {
	const div = document.createElement("div");
	div.textContent = content;
	return div.innerHTML;
    }
    let currentFocus;
    inputElement.addEventListener("input", async function() {
	let suggestionBox, suggestionItem, val = this.value;
	/* Dynamicly update the suggestions array or fetch it once for all*/
	if(suggestionUrl) {
	    if(search) {
		suggestionsArray = await fetch_data(suggestionUrl, val);
	    } else if (!("once" in main)) {
		suggestionsArray = await fetch_data(suggestionUrl, "");
		main.once = true;
	    }
	}
	if((!Array.isArray(suggestionsArray))) {
	    console.error("Suggestion Array cannot be empty or not array");
	    return;	
	}
	if(suggestionsArray.length < 1) {
	    console.error("Input array cannot be empty with no suggestions");
	    return;
	}
	closeAllLists();
	if (!val) return false;
	currentFocus = -1;

	suggestionBox = document.createElement("DIV");
	const boxCSS = {"position": "absolute",
			"border": "1px solid #ddd",
			"border-bottom": "none","border-top": "none",
			"z-index": "99","top": "100%","left": "0",
			"right": "0", "background-color": main.bgColor};
	for(const k in boxCSS) {
	    suggestionBox.style.setProperty(k,boxCSS[k])
	}
	this.parentNode.appendChild(suggestionBox);

	suggestionsArray.forEach(function(suggestion) {
            if (suggestion.toLowerCase().indexOf(val.toLowerCase()) > -1) {
		suggestionItem = document.createElement("DIV");
		const itemCSS  = {"padding": "10px",
				  "cursor": "pointer",
				  "border-bottom": "1px solid #ddd"};
		for(const k in itemCSS) {
		    suggestionItem.style.setProperty(k,itemCSS[k])
		}
		suggestionItem.onmouseover = function() {
		    this.style.backgroundColor = main.hoverColor;
		}
		suggestionItem.onmouseleave = function () {
		    this.style.backgroundColor = "";
		}
		const r = new RegExp(cleanHTML(val),"dgi");
		let suggestionHTML = cleanHTML(suggestion);
		new Set(suggestionHTML.match(r)).forEach(function(m) {
		    suggestionHTML = suggestionHTML.replaceAll(m,"<strong>" + m + "</strong>");
		});
		suggestionItem.innerHTML = suggestionHTML;
		let input = document.createElement("input");
		input.value = suggestion;
		input.type = "hidden";
		suggestionItem.appendChild(input);
		suggestionItem.addEventListener("click", function() {
		    inputElement.value = this.getElementsByTagName("input")[0].value;
		    closeAllLists();
		});
		suggestionBox.appendChild(suggestionItem);
	    }
	});
    });

    inputElement.addEventListener("keydown", function(e) {
	const keyCodes = {arrowDown: 40, arrowUp: 38, Enter: 13}
	let items = inputElement.parentElement.querySelectorAll("div > div");
	if (items) items = Array.from(items);
	if (e.keyCode == keyCodes.arrowDown) { 
	    currentFocus++;
	    if(currentFocus > 0 )
		addActive(items);
	} else if (e.keyCode == keyCodes.arrowUp) { 
	    currentFocus--;
	    if(currentFocus > 0 )
		addActive(items);		      
	} else if (e.keyCode == keyCodes.Enter) { 
	    e.preventDefault();
	    if (currentFocus > -1 && items) {
		items[currentFocus].click();
	    }
	}
    });
    
    function addActive(items) {
	if (!items) return false;
	removeActive(items);
	if (currentFocus >= items.length) currentFocus = 0;
	if (currentFocus < 0) currentFocus = items.length - 1;
	if(currentFocus > 0)
	    items[currentFocus].style.backgroundColor = main.hoverColor;
    }

    function removeActive(items) {
	items.forEach(function(item) { item.style.backgroundColor= ""});
    }
    
    function closeAllLists(elmnt) {
	let items = inputElement.parentElement.querySelectorAll(":scope > div");
	items.forEach(function(item) {
	    if (elmnt != item && elmnt != inputElement) {
		item.parentNode.removeChild(item);
	    }
	});
    }
    return main;
}


