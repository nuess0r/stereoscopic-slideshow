/**
 * Assigns an object instance to a global namespace.
 * Safely assigns instance object to the namespace, preserving any existing children of the namespace to allow for
 * async loading and evaluation of runtime scripts.
 *
 * @param {String} name - name of global namespace.
 * Can be single-level (e.g. "Foo") or multi-level (e.g "Foo.Bar").
 * If multi-level, each parent namespace that doesn't exist will also be defined if it's not already.
 * @param {Object} instance - object to assign to the global namespace
 */
function namespace(name, instance){
  if(typeof name !== "string") throw '\'name\' must be a string defining a namespace';
  if(typeof instance !== "object") throw '\'instance\' must be an object to assign to the namespace';

  var parts = name.split('.');
  var l = parts.length;
  var v;
  var i;

  var o = window;
  var n = '';

  for(i = 0; i < l; i++){
    v = parts[i];
    n += (n ? '.' : '') + v;

    if(n === name){
      if(typeof o[v] !== 'undefined'){
        // Target namespace already exists: move contents to temporary object then re-instate
        var k;
        var t = {};
        for(k in o[v]){
          t[k] = o[v][k];
        }
        o[v] = instance;
        for(k in t){
          o[v][k] = t[k];
        }
      }else{
        o[v] = instance;
      }
      o[v]['_initialised'] = true;
      document.dispatchEvent(new CustomEvent(name + '.ready'));
    }else{
      if(typeof o[v] === 'undefined'){
        o[v] = {};
      }
      o = o[v];
    }
  }
}

function onNamespacesLoaded(namespaces, thisFunction){
  if(typeof namespaces === 'string') namespaces = [namespaces];

  var namespacesLoaded = 0;
  var namespaceLoaded = function(){
    namespacesLoaded++
    if(namespacesLoaded === namespaces.length) thisFunction();
  }

  for(var j=0; j<namespaces.length; j++){
    var i, v,
            namespace = namespaces[j],
            ready = false,
            parts = namespace.split('.'),
            l = parts.length,
            o = window,
            n = '';
    for(i = 0; i < l; i++){
      v = parts[i];
      n += (n ? '.' : '') + v;
      if(typeof o[v] !== "object"){
        break;
      }else if(n === namespace && typeof o[v] === "object" && o[v]._initialised){
        ready = true;
      }
      o = o[v];
    }

    if(ready){
      namespaceLoaded();
    }else{
      document.addEventListener(namespace + '.ready', namespaceLoaded, false);
    }
  }
}
