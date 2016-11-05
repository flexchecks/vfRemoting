/*global*/
'use strict';
const RemoteAction = function(o) {
	const doBeforeSend = [];
	const doOnSuccess = [];
	const doOnFailure = [];
	const doOnComplete = [];

	var Manager;
	try {
		Manager = Visualforce.remoting.Manager;
	} catch(e) {

	}

	var fire = function(arry) {
		arry = Array.isArray(arry) ? arry : [];
		var args = Array.prototype.slice.call(arguments, 1);
		for(let i = 0; i < arry.length; i++) {
			if(typeof arry[i] === 'function')
				arry[i].apply(arry[i], args);
		}
	};
	

	const options = typeof o === 'object' ? o : undefined;

	var addFunction = function(arry) {
		var args = Array.from(arguments)[1];
		for(let i = 0; i < args.length; i++) {
			if(typeof args[i] === 'function')
				arry.push(args[i]); 
		}
		
	};

	this.getPrior = function() {
		return doBeforeSend;
	};

	this.getOnSuccess = function() {
		return doOnSuccess;
	};

	this.getOnFailure = function() {
		return doOnFailure;
	};

	this.getOnComplete = function() {
		return doOnComplete;
	};

	this.getOptions = function() {
		return options;
	};

	var removeFunction = function(arry, fnName) {
		if(fnName === undefined) {
			arry.splice(0, arry.length);
		}

		for(let i = 0; i < arry.length; i++) {
			if(arry[i].name === fnName)
				arry.splice(i, 1);
		}

		return arry;
	};

	this.onPrior = function() {
		addFunction(doBeforeSend, arguments);
		return this;
	};

	this.onSuccess = function() {
		addFunction(doOnSuccess, arguments);
		return this;
	};

	this.onFailure = function() {
		addFunction(doOnFailure, arguments);
		return this;
	};

	this.onComplete = function() {
		addFunction(doOnComplete, arguments);
		return this;
	};

	this.offPrior = function(fnName) {
		removeFunction(doBeforeSend, fnName);
		return this;
	};

	this.offSuccess = function(fnName) {
		removeFunction(doOnSuccess, fnName);
		return this;
	};

	this.offFailure = function(fnName) {
		removeFunction(doOnFailure, fnName);
		return this;
	};

	this.offComplete = function(fnName) {
		removeFunction(doOnComplete, fnName);
		return this;
	};

	this.setManager = function(mng) {
		Manager = mng;
		return this;
	};

	this.send = function(remoteAction) {
		if(Manager === undefined)
			throw new Error('Visualforce Manager not defined');

		if(remoteAction === undefined || typeof remoteAction !== 'string')
			throw new Error('Method must be a string');
		var parts = remoteAction.split('.');
		var namespace, controller, method;

		if(parts.length === 3) {
			namespace = parts[0];
			controller = parts[1];
			method = parts[2];
		} else if(parts.length === 2) {
			controller = parts[0];
			method = parts[0];
		} else {
			throw new Error('Invalid remote action supplied: ' + remoteAction);
		}

		var args = Array.prototype.slice.call(arguments, 1);

		args = args === undefined ? [] : args;

		var cb = function(vfResponse, vfEvent) {
			if(vfEvent.status && (vfResponse.isSuccess === undefined || vfResponse.isSuccess === true)) {
				fire(doOnSuccess, vfResponse, vfEvent, this);
				/*for(let i = 0; i < doOnSuccess.length; i++) {
					if(typeof doOnSuccess[i])
					doOnSuccess[i](vfResponse, vfEvent, this);
				}*/
			} else {
				var err = new Error(vfEvent.message);
				err.result = vfResponse;
				if(vfEvent.type === 'exception') {
					err.apexStackTrace = vfEvent.where;
				}
				fire(doOnFailure, vfResponse, err, this);
				/*
				for(let i = 0; i < doOnFailure.length; i++) {
					doOnFailure[i](err, vfResponse, this);
				}
				*/
			}
			fire(doOnComplete, vfResponse, vfEvent, this);
			/*
			for(let i = 0; i < doOnComplete.length; i++) {
				doOnComplete[i](this);
			}
			*/
		};

		args.push(cb);

		if(options !== undefined) {
			args.push(options);
		}

		args.splice(0,0,remoteAction);

		/*
		for(let i = 0; i < doBeforeSend.length; i++) {
			doBeforeSend[i](this);
		}
		*/
		fire(doBeforeSend, this);

		Manager.invokeAction.apply(Manager, args);
	};
};


const RemotePromise = function(o) {
	const ra = new RemoteAction(o);
	this.getRemoteAction = function() {
		return ra;
	};
	this.send = function(method, data) {
		return new Promise(function(resolve, reject) {
			ra
				.onSuccess(function doResolve(vfResponse, vfEvent) {
					resolve({response: vfResponse, event : vfEvent});
				})
				.onFailure(function doReject(err) {
					reject(err);
				});
			ra.send(method, data);
		});
	};
};
try {
	exports.RemoteAction = RemoteAction;
	exports.RemotePromise = RemotePromise;
} catch(e) {

}