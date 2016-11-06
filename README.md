# vfRemoting
Small library for wrapping Visualforce Remote Actions.
Built to work with my company's apex Remote Action framework, but should work with any remote action. If your response returns with a property of isSuccess as a falsy object, it will call the onFailure functions.
*****************************
#Usage
##RemoteAction
This example shows binding a function to each of the four states of the callback. These are not necessary, only if you need to perform an action at any of those steps.
```javascript
new RemoteAction(options)
  .onPrior(onPriorCallback)
  .onFailure(onFailureCallback)
  .onSuccess(onSuccessCallback)
  .onComplete(onCompletedCallback)
  .send('Remoter.get', {dataString:'This is some data to pass in', apexType:'RemoterImp.Request'});
```
##RemotePromise
This example shows the most basic usage of the RemotePromise, binding a callback to the resolve and rejected states and providing for error handling.
```javascript
new RemotePromise(options)
  .send('Remoter.get', {dataString:'This is some data to pass in', apexType:'RemoterImp.Request'})
  .then(onPromiseResolvedCallback, onPromisedRejectedCallback)
  .catch(onPromiseExceptionCallback);
```

This example shows how you can expose the RemoteAction object to bind additional functions
```javascript
// Create a new RemotePromise object.
var remotePromise = new RemotePromise(options);

// Bind callbacks to onPrior, onComplete, and onFailure
remotePromise.getRemoteAction()
  .onPrior(onPriorCallback)
  .onComplete(onCompleteCallback)
  .onFailure(onFailureCallback);

// Send the request and handle reject, resolve and catch exceptions.
remotePromise
  .send('Remoter.get', {dataString:'This is some data to pass in', apexType:'RemoterImp.Request'})
  .then(onPromiseResolvedCallback, onPromisedRejectedCallback)
  .catch(onPromiseExceptionCallback);
```
*****************************
# API Documentation
##RemoteAction(options)
**options:** An object type. This is the options object for visual force remoting calls.

The constructor for the basic RemoteAction object.
If obj is of type object, it will append this object in the invokeAction call as the object parameter.

### onPrior(function, [,function])
**function:** A function object

**function:** One or more additional function objects, separated by commas.

One or more functions that will be called after calling send() but before the remote action is invoked. Functions are called with a single parameter of the RemoteAction object.

### onSuccess(function, [,function])
**function:** A function object

**function:** One or more additional function objects, separated by commas.

One or more functions that will be called during the callback of the remote action if it is a success. Success is defined as a truthy event.status, and either an undefined response.isSuccess or a truthy response.isSuccess. Functions are called with three parameters. Response, Event, RemoteAction.

### onFailure(function, [,function])
**function:** A function object

**function:** One or more additional function objects, separated by commas.

One or more functions that will be called during the callback of the remote action if it is a failure. Failure is defined as not a success, or specifically, a falsy event.status or a falsey response.isSuccess. Functions are called with four parameters. Response, Event, Error, RemoteAction.

### onComplete(function, [,function])
**function:** A function object

**function:** One or more additional function objects, separated by commas.

One or more functions that will be called during the callback of the remote action regardless of its success or failure. Functions are called with three parameters. Response, Event, RemoteAction.

### offPrior(function-name), offPrior()
**function-name:** String representing the name of a function. _(optional)_

Removes the specificed named function from the onPrior array. If no name is supplied, removes all functions.

### offSuccess(function-name), offSuccess()
**function-name:** String representing the name of a function. _(optional)_

Removes the specificed named function from the onSuccess array. If no name is supplied, removes all functions.

### offFailure(function-name), offFailure()
**function-name:** String representing the name of a function. _(optional)_

Removes the specificed named function from the onFailure array. If no name is supplied, removes all functions.

### offComplete(function-name), offComplete()
**function-name:** String representing the name of a function. _(optional)_

Removes the specificed named function from the onComplete array. If no name is supplied, removes all functions.

### getPrior(), getSuccess(), getFailure(), getComplete()
Returns the array of functions for the specified array. Mostly used in testing.

### setManager(Manager)
**Manager:** Object type with an invokeAction function. Useful for testing to pass a Mock in.

### setValidator(Function) 
**Function:** A function to use as a data validator. 

The data validator is called before the remote action is invoked, and is passed in all the arguments that will be passed into the remote action as parameters. Use this to set implementation specific data validation.

### send(Remote-Action-Name, [,Parameter])
**Remote-Action-Name:** The fully qualified remote action name in the format of _Namespace_._Controller_._Method_

**Parameter:** One or more parameters for the RemoteAction Method, separated by commas. _(optional)_

Invokes the specified Remote Action with the provided parameters. Calls bound functions at the following times:
+ **onPrior:** Before the remoteAction invokation
+ **onSuccess:** During the remoteAction callback on a success
+ **onFailure:** During the remoteAction callback on a failure
+ **onComplete:** During the remoteAction callback regardless of success or failure.

## RemotePromise(options)
**options:** An object type. This is the options object for visual force remoting calls.

The constructor for the RemoteAction object wrapped in a promise object.

### getRemoteAction()
Returns the RemoteAction instance to expose its functions.

### send(Remote-Action-Name, [,Parameter])
**Remote-Action-Name:** The fully qualified remote action name in the format of _Namespace_._Controller_._Method_

**Parameter:** One or more parameters for the RemoteAction Method, separated by commas. _(optional)_

Adds a function to reject the promise onFailure, and resolve the promise onSuccess, then calls the RemoteAction.send(Remote-Action-Name, [,Parameter]) function.

