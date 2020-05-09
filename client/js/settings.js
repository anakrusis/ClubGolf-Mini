function SETTINGS() {}

SETTINGS.prototype.init = function() {
	this.optsDefault = {
		playerName: "hello",
		connectionString: "http://localhost:23456"
	}

	this.localStorageKey = "gameSettings";
	this.settingsFormSelector = "#form";
	this.frm = document.querySelector(this.settingsFormSelector);
	
	this.formOnSubmit = this.formOnSubmit.bind(this);
	this.frm.addEventListener('submit', this.formOnSubmit, false);
	
	this.load();
}

SETTINGS.prototype.formOnSubmit = function(e) {
	e.preventDefault();
	
	this.opts = {
		playerName: this.frm.querySelector(".setting[name='playerName']").value,
		connectionString: this.frm.querySelector(".setting[name='connectionString']").value
	}

	this.save();
	socket.connect();
}

SETTINGS.prototype.get = function() {
	return this.opts;
}

SETTINGS.prototype.save = function() {
	localStorage.setItem(this.localStorageKey, JSON.stringify(this.opts));
}

SETTINGS.prototype.load = function() {
	
	if (opts = JSON.parse(localStorage.getItem(this.localStorageKey))) {	
	} else {
		opts = this.optsDefault;
	}
	
	for (var i in opts) {
		this.frm.querySelector(".setting[name='"+i+"']").value = opts[i];
	}
	
	this.opts = opts;
}