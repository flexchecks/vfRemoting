/*global*/
/*
MIT License

Copyright (c) 2016 Zachary C. Trank-Zelewicz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';
const RemoteAction = function(o) {
	const doBeforeSend = [];	// Array of functions to call before invoking Manager.invokeAction
	const doOnSuccess = [];		// Array of functions to call during the remote action callback when the response is a success
	const doOnFailure = [];		// Array of functions to call during the remote action callback when the response is a failure
	const doOnComplete = [];	// Array of functions to call during the remote action callback regardless if it is a success or failure

	var Manager;				// The manager, defaults to Visualforce.remoting.Manager
	try {
		// Try to set the manager, if it fails, then the remoting manager is not present on the page.
		Manager = Visualforce.remoting.Manager;
	} catch(e) {
		console.log('No Remoting Manager found');
	}
	
	// Set the options object if it is an object.
	const options = typeof o === 'object' ? o : undefined;

	// Logic to bind a funciton to one of the arrays. This will only add objects where typeof  is a Function
	var addFunction = function(arry) {
		var args = Array.from(arguments)[1];
		for(var i = 0; i < args.length; i++) {
			if(typeof args[i] === 'function')
				arry.push(args[i]); 
		}
		
	};

	// Logic to find and unbind a named function from one of the arrays. If no name is provided, all functions are unbound.
	var removeFunction = function(arry, fnName) {
		if(fnName === undefined) {
			arry.splice(0, arry.length);
		}

		for(var i = 0; i < arry.length; i++) {
			if(arry[i].name === fnName)
				arry.splice(i, 1);
		}

		return arry;
	};

	// Fires each function found in one of the binding arrays
	var fire = function(arry) {
		arry = Array.isArray(arry) ? arry : [];
		var args = Array.prototype.slice.call(arguments, 1);
		for(var i = 0; i < arry.length; i++) {
			if(typeof arry[i] === 'function')
				arry[i].apply(arry[i], args);
		}
	};
	
	// Default data validation
	var validator = function() {
		return;
	};

	/* ----------------------------------------- Getters ----------------------------------------- */
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

	/* ------------------------------------ Binding Functions ------------------------------------ */
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

	/* ----------------------------------- Unbinding Functions ----------------------------------- */
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

	/* ------------------------------------- Set the Manager ------------------------------------- */
	this.setManager = function(mng) {
		Manager = mng;
		return this;
	};

	/* ----------------------------------- Set Data Validator  ----------------------------------- */
	this.setValidator = function(fn) {
		// Validator methods should throw exceptions when the arguments are invalid.
		// Use this to prevent sending in objects that don't meet your implementation specific criteria
		if(typeof fn === 'function')
			validator = fn;
		return this;
	};

	/* -------------------------------- Invoke the Remote Action  -------------------------------- */
	this.send = function(remoteAction) {
		// Make sure there is a manager
		if(Manager === undefined)
			throw new Error('Visualforce Manager not defined');

		// Make sure the remoteAction is a string
		if(remoteAction === undefined || typeof remoteAction !== 'string')
			throw new Error('Method must be a string');

		/* 
		 * Make sure the remote action fits the requirements of:
		 * Namespace.Controller.Method
		 * or
		 * Controller.Method
		 */
		var parts = remoteAction.split('.');
		
		if(parts.length > 3 || parts.length < 2)
			throw new Error('Invalid remote action supplied: ' + remoteAction);

		// Get all the other parameters and add them to a list
		var args = Array.prototype.slice.call(arguments, 1);

		args = args === undefined ? [] : args;

		// Send the arguments through the validator.
		if(typeof validator === 'function') {
			validator.apply(validator, args);
		}

		// Callback for the remote action
		var cb = function(vfResponse, vfEvent) {
			// Check if the status is Truthy, and isSuccess is either true or undefined
			if(vfEvent.status && (vfResponse.isSuccess === undefined || vfResponse.isSuccess === true)) {
				// Fire all onSuccess bound functions
				fire(doOnSuccess, vfResponse, vfEvent, this);
			} else {
				// Create an error object
				var err = new Error(vfEvent.message);
				err.result = vfResponse;
				if(vfEvent.type === 'exception') {
					err.apexStackTrace = vfEvent.where;
				}
				// Fire all onFailure bound functions
				fire(doOnFailure, vfResponse, vfEvent, err, this);
			}

			// Fire all onComplete bound functions
			fire(doOnComplete, vfResponse, vfEvent, this);
		};

		// Add the callback to the list of parameters
		args.push(cb);

		// If options is defined, add that to the list of parameters
		if(options !== undefined) {
			args.push(options);
		}

		// Put the remote action in the front of the list
		args.splice(0,0,remoteAction);

		// Fire all onPrior bound functions
		fire(doBeforeSend, this);

		// Invoke the remote action
		Manager.invokeAction.apply(Manager, args);
	};
};


const RemotePromise = function(o) {

	// Create a new instance of RemoteAction
	const ra = new RemoteAction(o);

	// Returns the RemoteAction object to expose its functions
	this.getRemoteAction = function() {
		return ra;
	};

	// Returns a promise object of the RemoteAction
	this.send = function(method, data) {
		return new Promise(function(resolve, reject) {
			// Bind a function to onSuccess to resolve the promise, and onFailure to reject the promise, then send the request.
			try {
				ra
					.onSuccess(function doResolve(vfResponse, vfEvent, remoteAction) {
						resolve({response: vfResponse, event : vfEvent, remoteAction : remoteAction});
					})
					.onFailure(function doReject(vfResponse, vfEvent, err, remoteAction) {
						reject({response: vfResponse, event : vfEvent, remoteAction : remoteAction, error: err});
					})
					.send(method, data);
			} catch(e) {
				reject(e);
			}
			
		});
	};
};

try {
	exports.RemoteAction = RemoteAction;
	exports.RemotePromise = RemotePromise;
} catch(e) {

}